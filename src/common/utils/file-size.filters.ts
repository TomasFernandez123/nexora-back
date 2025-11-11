import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class FileSizeFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      return response.status(413).json({
        statusCode: 413,
        message: 'El archivo supera el tamaño máximo permitido (20 MB).',
      });
    }

    return response.status(400).json({
      statusCode: 400,
      message: `Error de subida: ${exception.message}`,
    });
  }
}
