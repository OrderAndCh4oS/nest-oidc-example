import { Controller, Get, Render } from "@nestjs/common";

@Controller('pages')
export class PagesController {
  @Get()
  @Render('login')
  login() {
    return { message: 'Hello world!' };
  }

  @Get()
  @Render('interaction')
  consent() {
    return { message: 'Hello world!' };
  }

  @Get()
  @Render('repost')
  repost() {
    return { message: 'Hello world!' };
  }
}
