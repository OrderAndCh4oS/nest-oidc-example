import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProviderService } from '../provider/provider.service';
import Account from '../utilities/account';

@Controller('interaction')
export class InteractionController {
  constructor(private providerService: ProviderService) {}

  @Get('/:uid')
  async index(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const { uid, prompt, params, session } =
        await this.providerService.provider.interactionDetails(req, res);

      const client = await this.providerService.provider.Client.find(
        params.client_id,
      );

      switch (prompt.name) {
        case 'login': {
          return res.render('login', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Sign-in',
            session: session || null,
            dbg: {
              params: params || null,
              prompt: prompt || null,
            },
          });
        }
        case 'consent': {
          return res.render('interaction', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Authorize',
            session: session || null,
            dbg: {
              params: params || null,
              prompt: prompt || null,
            },
          });
        }
        default:
          return undefined;
      }
    } catch (err) {
      res.render('error', { message: 'Failed to handle interaction' });
    }
  }

  @Post('/:uid/login')
  async login(@Body() body, @Req() req: Request, @Res() res: Response) {
    try {
      const {
        prompt: { name },
      } = await this.providerService.provider.interactionDetails(req, res);
      console.log('name', name);
      if (name !== 'login') throw new Error('Not a login interaction');
      const account = await Account.findByLogin(body.login);

      const result = {
        login: {
          accountId: account.accountId,
        },
      };

      await this.providerService.provider.interactionFinished(
        req,
        res,
        result,
        { mergeWithLastSubmission: false },
      );
    } catch (err) {
      console.log('Error:', err);
      res.render('error', { message: 'Failed to handle login' });
    }
  }

  @Post('/:uid/confirm')
  async confirm(@Body() body, @Req() req: Request, @Res() res: Response) {
    try {
      const interactionDetails =
        await this.providerService.provider.interactionDetails(req, res);
      const {
        prompt: { name, details },
        params,
        session: { accountId },
      } = interactionDetails;

      if (name !== 'consent') throw new Error('Not a consent interaction');

      let { grantId } = interactionDetails;
      let grant;

      if (grantId) {
        // we'll be modifying existing grant in existing session
        grant = await this.providerService.provider.Grant.find(grantId);
      } else {
        // we're establishing a new grant
        grant = new this.providerService.provider.Grant({
          accountId,
          clientId: params.client_id,
        });
      }

      if (details.missingOIDCScope) {
        grant.addOIDCScope(details.missingOIDCScope.join(' '));
      }
      if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims);
      }
      if (details.missingResourceScopes) {
        // eslint-disable-next-line no-restricted-syntax
        for (const [indicator, scopes] of Object.entries(
          details.missingResourceScopes,
        )) {
          grant.addResourceScope(indicator, (scopes as string[]).join(' '));
        }
      }

      grantId = await grant.save();

      const consent: any = {};
      if (!interactionDetails.grantId) {
        // we don't have to pass grantId to consent, we're just modifying existing one
        consent.grantId = grantId;
      }

      const result = { consent };
      await this.providerService.provider.interactionFinished(
        req,
        res,
        result,
        {
          mergeWithLastSubmission: true,
        },
      );
    } catch (err) {
      console.log('Error:', err);
      res.render('error', { message: 'Failed to handle confirm' });
    }
  }
}
