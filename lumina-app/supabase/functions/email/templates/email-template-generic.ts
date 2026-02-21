/**
 * Generic Email Template
 *
 * This file provides a configurable email template that can be used for various email types.
 * It accepts a configuration object that allows customization of various elements like
 * logo, title, content, colors, etc.
 */

import { EmailTemplateInputParams } from '../../_shared-client/email/EmailService.ts';

/**
 * Interface for the email template configuration
 */
export type EmailTemplateGenericParams = {
  // Company/Brand Information
  logoUrl: string;
  logoAltText: string;
  logoWidth?: number; // in pixels

  // Content
  title: string;
  bodyContent: string;

  // Footer
  footerText: string;

  // Colors and Styling
  backgroundColor?: string;
  contentBackgroundColor?: string;
  titleColor?: string;
  bodyColor?: string;
  footerColor?: string;
  dividerColor?: string;

  // Optional additional content
  additionalHtml?: string; // For any additional HTML content like buttons, images, etc.
} & EmailTemplateInputParams;

/**
 * Generates an HTML email template based on the provided configuration
 *
 * @param params The configuration object for customizing the email template
 * @returns A string containing the HTML email template
 */
export function getGenericEmailTemplate(params: EmailTemplateGenericParams): string {
  // Set default values for optional parameters
  const logoWidth = params.logoWidth ?? 200;
  const backgroundColor = params.backgroundColor ?? '#f7f7f7';
  const contentBackgroundColor = params.contentBackgroundColor ?? '#ffffff';
  const titleColor = params.titleColor ?? '#555555';
  const bodyColor = params.bodyColor ?? '#555555';
  const footerColor = params.footerColor ?? '#555555';
  const dividerColor = params.dividerColor ?? '#e0e0e0';

  return `
  <!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>
  </title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    p {
      display: block;
      margin: 13px 0;
    }
  </style>
  <!--[if mso]>
        <noscript>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        </noscript>
        <![endif]-->
  <!--[if lte mso 11]>
        <style type="text/css">
          .mj-outlook-group-fix { width:100% !important; }
        </style>
        <![endif]-->
  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    }
  </style>
  <style media="screen and (min-width:480px)">
    .moz-text-html .mj-column-per-100 {
      width: 100% !important;
      max-width: 100%;
    }
  </style>
  <style type="text/css">
    @media only screen and (max-width:480px) {
      table.mj-full-width-mobile {
        width: 100% !important;
      }

      td.mj-full-width-mobile {
        width: auto !important;
      }
    }
  </style>
  <!-- Optional inline style block for custom classes -->
</head>

<body style="word-spacing:normal;background-color:${backgroundColor};">
  <div style="background-color:${backgroundColor};">
    <!-- Main section with a white background for content -->
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" bgcolor="${contentBackgroundColor}" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
    <div style="background:${contentBackgroundColor};background-color:${contentBackgroundColor};margin:0px auto;max-width:600px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:${contentBackgroundColor};background-color:${contentBackgroundColor};width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:560px;" ><![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                  <tbody>
                    <!-- Logo -->
                    <tr>
                      <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                          <tbody>
                            <tr>
                              <td style="width:${logoWidth}px;">
                                <img alt="${params.logoAltText}" height="auto" src="${params.logoUrl}" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="${logoWidth}">
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <!-- A divider to separate header from content -->
                    <tr>
                      <td align="center" style="font-size:0px;padding:20px 0;word-break:break-word;">
                        <p style="border-top:solid 1px ${dividerColor};font-size:1px;margin:0px auto;width:100%;">
                        </p>
                        <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" style="border-top:solid 1px ${dividerColor};font-size:1px;margin:0px auto;width:560px;" role="presentation" width="560px" ><tr><td style="height:0;line-height:0;"> &nbsp;
</td></tr></table><![endif]-->
                      </td>
                    </tr>
                    <!-- Email Title -->
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;padding-bottom:10px;word-break:break-word;">
                        <div style="font-family:Helvetica, Arial, sans-serif;font-size:20px;font-weight:bold;line-height:1.5;text-align:left;color:${titleColor};">${
                          params.title
                        }</div>
                      </td>
                    </tr>
                    <!-- Email body copy -->
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;padding-bottom:20px;word-break:break-word;">
                        <div style="font-family:Helvetica, Arial, sans-serif;font-size:16px;line-height:1.5;text-align:left;color:${bodyColor};">${
                          params.bodyContent
                        }</div>
                      </td>
                    </tr>

                    ${params.additionalHtml ?? ''}

                    <!-- Footer Divider -->
                    <tr>
                      <td align="center" style="font-size:0px;padding:20px 0;word-break:break-word;">
                        <p style="border-top:solid 1px ${dividerColor};font-size:1px;margin:0px auto;width:100%;">
                        </p>
                        <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" style="border-top:solid 1px ${dividerColor};font-size:1px;margin:0px auto;width:560px;" role="presentation" width="560px" ><tr><td style="height:0;line-height:0;"> &nbsp;
</td></tr></table><![endif]-->
                      </td>
                    </tr>
                    <!-- Footer text -->
                    <tr>
                      <td align="center" class="footer-text" style="font-size: 0px; padding: 10px 25px; word-break: break-word;">
                        <div style="font-family:Helvetica, Arial, sans-serif;font-size:16px;line-height:1.5;text-align:center;color:${footerColor};">${
                          params.footerText
                        }</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--[if mso | IE]></td></tr></table><![endif]-->
  </div>
</body>

</html>
`;
}
