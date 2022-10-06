import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import { ProviderService } from '../provider/provider.service';

@Controller()
export class OidcController {
  constructor(private providerService: ProviderService) {}

  @All('/*')
  public mountedOidc(@Req() req: Request, @Res() res: Response): void {
    return this.providerService.callback(req, res);
  }
}
