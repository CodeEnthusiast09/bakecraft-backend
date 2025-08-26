export interface ApiResponse<T = any> {
  success: boolean;
  message: string | string[];
  data?: T;
}

export const successResponse = <T>(
  message: string,
  data?: T,
): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message: string | string[]): ApiResponse => ({
  success: false,
  message,
});
