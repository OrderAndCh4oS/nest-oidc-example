import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InteractionController } from './interaction/interaction.controller';
import { OidcController } from './oidc/oidc.controller';
import { ProviderService } from './provider/provider.service';
import { PagesController } from './pages/pages.controller';

@Module({
  imports: [],
  controllers: [InteractionController, OidcController],
  providers: [AppService, ProviderService],
})
export class AppModule {}
