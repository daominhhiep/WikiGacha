import { Test, TestingModule } from '@nestjs/testing';
import { TransformInterceptor } from './transform.interceptor';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  const mockCallHandler = {
    handle: jest.fn().mockReturnValue(of('test data')),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformInterceptor],
    }).compile();

    interceptor = module.get<TransformInterceptor<any>>(TransformInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform response data', (done) => {
    interceptor.intercept(mockExecutionContext as any, mockCallHandler as any).subscribe({
      next: (result) => {
        expect(result).toEqual({
          success: true,
          data: 'test data',
        });
        done();
      },
    });
  });
});
