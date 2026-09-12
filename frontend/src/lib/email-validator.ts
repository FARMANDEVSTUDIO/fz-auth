const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'grr.la', 'guerrillamailblock.com', 'sharklasers.com',
  'guerrillamail.de', 'tempail.com', 'temp-mail.org', 'temp-mail.io',
  'mailinator.com', 'maildrop.cc', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'dispostable.com', 'trashmail.com', 'trashmail.net', 'trashmail.me',
  'trashmail.io', 'trashmail.org', 'harakirimail.com', 'mailnesia.com',
  'mailtemp.info', 'tempinbox.com', 'tmails.net', 'tmpmail.net',
  'tmpmail.org', 'emailondeck.com', 'getnada.com', 'mohmal.com',
  'binkmail.com', 'bobmail.info', 'burnthismail.com', 'devnullmail.com',
  'discard.email', 'discardmail.com', 'discardmail.de', 'emailfake.com',
  'fakeinbox.com', 'fakemail.fr', 'fakemailgenerator.com', 'inboxbear.com',
  'jetable.org', 'mailcatch.com', 'mailexpire.com', 'mailforspam.com',
  'mailhazard.com', 'mailhazard.us', 'mailmoat.com', 'mailnator.com',
  'mailscrap.com', 'mailseal.de', 'mailshell.com', 'mailsiphon.com',
  'mailslite.com', 'mailzilla.com', 'mintemail.com', 'mmmmail.com',
  'mobi.web.id', 'mt2015.com', 'mytemp.email', 'mytrashmail.com',
  'nobulk.com', 'noclickemail.com', 'nogmailspam.info', 'nomail.xl.cx',
  'nospam.ze.tc', 'objectmail.com', 'obobbo.com', 'onewaymail.com',
  'owlpic.com', 'proxymail.eu', 'punkass.com', 'putthisinyouremail.com',
  'reallymymail.com', 'recode.me', 'recursor.net', 'regbypass.com',
  'safetypost.de', 'shieldedmail.com', 'slaskpost.se', 'sogetthis.com',
  'soodonims.com', 'spam4.me', 'spamavert.com', 'spambob.com',
  'spambob.net', 'spambob.org', 'spambox.us', 'spamcero.com',
  'spamcorptastic.com', 'spamcowboy.com', 'spamcowboy.net',
  'spamcowboy.org', 'spamday.com', 'spamex.com', 'spamfighter.cf',
  'spamfighter.ga', 'spamfighter.gq', 'spamfighter.ml', 'spamfighter.tk',
  'spamfree24.com', 'spamfree24.de', 'spamfree24.eu', 'spamfree24.info',
  'spamfree24.net', 'spamfree24.org', 'spamgoes.in', 'spamherelots.com',
  'spamhereplease.com', 'spamhole.com', 'spamify.com', 'spaminator.de',
  'spamkill.info', 'spaml.com', 'spaml.de', 'spammotel.com',
  'spamobox.com', 'spamoff.de', 'spamslicer.com', 'spamspot.com',
  'spamstack.net', 'spamthis.co.uk', 'spamtrail.com', 'spamtrap.ro',
  'speed.1s.fr', 'superrito.com', 'suremail.info', 'teleworm.us',
  'thankyou2010.com', 'thisisnotmyrealemail.com', 'throwam.com',
  'tittbit.in', 'tmail.ws', 'tmailinator.com', 'toiea.com',
  'tradermail.info', 'trash-amil.com', 'trash-mail.at', 'trash-mail.com',
  'trash-mail.de', 'trash2009.com', 'trash2010.com', 'trash2011.com',
  'trashdevil.com', 'trashdevil.de', 'trashemail.de', 'trashymail.com',
  'trashymail.net', 'trbvm.com', 'trbvn.com', 'turual.com',
  'twinmail.de', 'tyldd.com', 'uggsrock.com', 'upliftnow.com',
  'uplipht.com', 'venompen.com', 'veryreallyfakeemails.com',
  'viditag.com', 'viewcastmedia.com', 'viewcastmedia.net',
  'viewcastmedia.org', 'vomoto.com', 'vpn.st', 'vsimcard.com',
  'vubby.com', 'wasteland.rfc822.org', 'webemail.me', 'weg-werf-email.de',
  'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'wh4f.org', 'whatiaas.com', 'whatpaas.com', 'whyspam.me',
  'wikidocuslice.com', 'willselfdestruct.com', 'winemaven.info',
  'wronghead.com', 'wuzup.net', 'wuzupmail.net', 'wwwnew.eu',
  'xagloo.com', 'xemaps.com', 'xents.com', 'xjoi.com', 'xmaily.com',
  'xoxy.net', 'yep.it', 'yogamaven.com', 'yuurok.com',
  'zehnminutenmail.de', 'zippymail.info', 'zoaxe.com', 'zoemail.org',
  '10minutemail.com', '10minutemail.net', '20minutemail.com',
  'mailnull.com', 'bugmenot.com', 'deadaddress.com',
  'e4ward.com', 'getairmail.com', 'incognitomail.org',
  'mailblocks.com', 'mailsucker.net', 'messagebeamer.de',
  'nervmich.net', 'nervtansen.de', 'nobulk.com',
  'mail-temporaire.fr', 'crazymailing.com', 'disposableemailaddresses.emailmiser.com',
  'emailmiser.com', 'emailsensei.com', 'emailtemporario.com.br',
  'fmail.co.uk', 'flyspam.com', 'imstations.com', 'instant-mail.de',
  'ipoo.org', 'irish2me.com', 'iwi.net', 'jetable.com',
  'kasmail.com', 'koszmail.pl', 'kurzepost.de', 'lawlita.com',
  'letthemeatspam.com', 'lhsdv.com', 'lifebyfood.com',
  'link2mail.net', 'litedrop.com', 'lol.ovpn.to', 'lookugly.com',
  'lopl.co.cc', 'lortemail.dk', 'lr78.com', 'lroid.com',
  'maboard.com', 'mail.by', 'mail.mezimages.net', 'mail.zp.ua',
  'mail2rss.org', 'mail333.com', 'mail4trash.com', 'mailbidon.com',
  'mailblocks.com', 'mailcatch.com', 'mailde.de', 'mailde.info',
  'maildx.com', 'maileater.com', 'mailed.ro', 'mailexpire.com',
  'mailfa.tk', 'mailin8r.com', 'mailinater.com', 'mailinator.net',
  'mailinator.org', 'mailinator2.com', 'mailincubator.com',
  'mailme.ir', 'mailme.lv', 'mailmetrash.com', 'mailquack.com',
  'mailscrap.com', 'mailshell.com', 'mailsiphon.com',
  'meltmail.com', 'mezimages.net', 'migmail.pl', 'migumail.com',
  'ministry-of-silly-walks.de', 'mintemail.com', 'misterpinball.de',
  'mmmmail.com', 'mobi.web.id', 'mobileninja.co.uk',
  'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  'mt2009.com', 'mx0.wwwnew.eu', 'mycleaninbox.net',
  'mypartyclip.de', 'myphantom.com', 'mysamp.de', 'myspaceinc.com',
  'myspaceinc.net', 'myspaceinc.org', 'myspacepimpedup.com',
  'mytrashmail.com', 'nabala.com', 'neomailbox.com',
  'nepwk.com', 'nervmich.net', 'nervtansen.de',
  'netmails.com', 'netmails.net', 'neverbox.com',
  'no-spam.ws', 'noclickemail.com', 'nogmailspam.info',
  'nomail.xl.cx', 'nomail2me.com', 'nomorespamemails.com',
  'nospam.ze.tc', 'nospam4.us', 'nospamfor.us',
  'nospammail.net', 'nothingtoseehere.ca', 'nowmymail.com',
  'nurfuerspam.de', 'nus.edu.sg', 'nwldx.com',
  'objectmail.com', 'obobbo.com', 'odnorazovoe.ru',
]);

const ALLOWED_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'yahoo.fr', 'yahoo.de', 'yahoo.ca',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'aol.com',
  'zoho.com', 'zohomail.com',
  'mail.com',
  'gmx.com', 'gmx.net', 'gmx.de',
  'fastmail.com', 'fastmail.fm',
  'tutanota.com', 'tuta.io',
  'yandex.com', 'yandex.ru',
  'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru',
  'cox.net', 'sbcglobal.net', 'att.net', 'comcast.net', 'verizon.net',
  'bellsouth.net', 'charter.net', 'earthlink.net',
  'qq.com', '163.com', '126.com', 'sina.com',
  'rediffmail.com',
  'hey.com',
]);

export function validateEmail(email: string): { valid: boolean; reason?: string } {
  const trimmed = email.trim().toLowerCase();

  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  const domain = trimmed.split('@')[1];
  if (!domain || domain.length < 4) {
    return { valid: false, reason: 'Invalid email domain' };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: 'Disposable/temporary emails are not allowed. Use a real email provider (Gmail, Outlook, etc.)' };
  }

  if (!ALLOWED_DOMAINS.has(domain)) {
    return { valid: false, reason: 'This email provider is not supported. Please use Gmail, Outlook, Yahoo, ProtonMail, or another major provider.' };
  }

  return { valid: true };
}
