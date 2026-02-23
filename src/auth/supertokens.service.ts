import { Injectable } from '@nestjs/common';
import supetokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupertokensService {
  constructor(private configService: ConfigService) {
    const port = this.configService.get<string>('PORT') || '3000';
    const renderExternalUrl = this.configService.get<string>('RENDER_EXTERNAL_URL');

    let apiDomain: string;
    let websiteDomain: string;

    if (renderExternalUrl) {
        apiDomain = renderExternalUrl;
        websiteDomain = renderExternalUrl;
    } else {
        const envApiDomain = this.configService.get<string>('SUPERTOKENS_API_DOMAIN');
        const envWebsiteDomain = this.configService.get<string>('SUPERTOKENS_WEBSITE_DOMAIN');

        apiDomain = envApiDomain || `http://localhost:${port}`;
        websiteDomain = envWebsiteDomain || `http://localhost:${port}`;

        if (apiDomain.includes('${PORT}')) {
          apiDomain = apiDomain.replace('${PORT}', port);
        }
        if (websiteDomain.includes('${PORT}')) {
          websiteDomain = websiteDomain.replace('${PORT}', port);
        }
    }
    

    supetokens.init({
      appInfo: {
        appName: 'Book Network',
        apiDomain,
        websiteDomain,
        apiBasePath: '/auth',
        websiteBasePath: '/auth',
      },

      supertokens: {
        connectionURI: this.configService.get<string>('SUPERTOKENS_CONNECTION_URI', 'https://try.supertokens.com'), 
        apiKey: this.configService.get<string>('SUPERTOKENS_API_KEY'),
      },
      recipeList: [
        EmailPassword.init(),
        Session.init({
            cookieSecure: false,
            cookieSameSite: "lax",
            getTokenTransferMethod: () => 'cookie',
            antiCsrf: "NONE",
        }),
      ],
    });
  }
}
