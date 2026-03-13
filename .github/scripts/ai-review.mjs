import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { execSync } from "child_process";
import fs from "fs";

async function run() {
  const token = process.env["GITHUB_TOKEN"];
  const prNumber = process.env["PR_NUMBER"];
  const endpoint = "https://models.github.ai/inference";
  const modelName = "openai/gpt-4o";

  if (!token || !prNumber) {
    console.error("Missing GITHUB_TOKEN or PR_NUMBER.");
    process.exit(1);
  }

  // 1. Get and Filter Diff
  console.log(`Fetching diff for PR #${prNumber}...`);
  let diff = "";
  try {
    diff = execSync(`gh pr diff ${prNumber}`, { encoding: 'utf8', env: { ...process.env, GH_TOKEN: token } });
  } catch (err) {
    console.error("Failed to fetch PR diff:", err.message);
    process.exit(1);
  }

  if (!diff || diff.trim().length === 0) {
    console.log("No changes detected in diff, skipping review.");
    return;
  }

  const filteredDiff = diff
    .split('diff --git')
    .filter(fileDiff => {
      const isNoise = /package-lock\.json|yarn\.lock|pnpm-lock\.yaml|dist\/|\.png|\.jpg|\.svg/.test(fileDiff);
      return !isNoise;
    })
    .join('diff --git')
    .substring(0, 80000); // Slightly larger context allowed for gpt-4o

  // 2. Initialize SDK Client
  const client = ModelClient(endpoint, new AzureKeyCredential(token));

  // 3. Call GitHub Models API
  console.log(`Calling GitHub Models via SDK (${modelName})...`);
  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { 
          role: "system", 
          content: "You are a senior engineer for 'wikigacha' (NestJS/React/Prisma). Review the following PR diff for bugs, security, and performance. Be concise and actionable. If perfect, say 'LGTM! 🚀'." 
        },
        { role: "user", content: `Review this diff:\n\n${filteredDiff}` }
      ],
      model: modelName,
      temperature: 0.1
    }
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  const reviewContent = response.body.choices[0].message.content;

  // 4. Manage Comments: Delete previous AI reviews to keep the thread clean
  console.log("Searching for previous AI review comments...");
  try {
    const commentsJson = execSync(`gh pr view ${prNumber} --json comments`, { encoding: 'utf8', env: { ...process.env, GH_TOKEN: token } });
    const comments = JSON.parse(commentsJson).comments;
    const aiComments = comments.filter(c => c.body.includes("### 🤖 AI Code Review"));
    
    for (const comment of aiComments) {
      console.log(`Deleting old AI review: ${comment.id}`);
      // Using gh api to delete specifically by ID
      execSync(`gh api -X DELETE repos/:owner/:repo/issues/comments/${comment.id}`, { env: { ...process.env, GH_TOKEN: token } });
    }
  } catch (err) {
    console.warn("Could not clean up old comments:", err.message);
  }

  // 5. Post New Review Comment
  console.log("Posting new review comment...");
  const commentBody = `### 🤖 AI Code Review (${modelName})\n\n${reviewContent}\n\n---\n*Review generated via GitHub Models SDK. (Last updated: ${new Date().toISOString()})*`;
  fs.writeFileSync('review_comment.md', commentBody);
  
  execSync(`gh pr comment ${prNumber} --body-file review_comment.md`, {
    env: { ...process.env, GH_TOKEN: token }
  });

  console.log("Review complete!");
}

run().catch((err) => {
  console.error("The review encountered an error:", err);
  process.exit(1);
});
