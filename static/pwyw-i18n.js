/* PWYW locale layer: authored UI/game strings only; never machine-translate merchant content.
   Public API: PWYWI18N.locale(), .t(source), .setLocale('de'|'fa').
   No server-side dependencies and no payment/service data changes. */
(() => {
  'use strict';
  const catalog = new Map();
  // catalog entries are registered below, as explicit reviewed UI translations.
  const entries = [
    ["play with purpose","Spielen mit Wirkung","بازی با هدف"],
    ["Die Idee","Die Idee","ایده"],
    ["Vier Produkte","Vier Produkte","چهار محصول"],
    ["Brand Worlds","Markenwelten","دنیای برندها"],
    ["10 Spiele","10 Spiele","۱۰ بازی"],
    ["Studio öffnen","Studio öffnen","ورود به استودیو"],
    ["INTRODUCING A NEW WAY TO PLAY","EINE NEUE ART ZU SPIELEN","شیوه‌ای تازه برای بازی"],
    ["Make","Mach","کن"],
    ["waiting","Warten","انتظار را"],
    ["worth it","wertvoll","ارزشمند"],
    ["Die Aufmerksamkeit ist schon da. Gib ihr eine Richtung. Mit kleinen Markenspielen, die nicht nur unterhalten, sondern Menschen zum Kaufen, Wiederkommen, Weiterempfehlen oder Verstehen bewegen.","Die Aufmerksamkeit ist schon da. Gib ihr eine Richtung. Mit kleinen Markenspielen, die nicht nur unterhalten, sondern Menschen zum Kaufen, Wiederkommen, Weiterempfehlen oder Verstehen bewegen.","توجه مشتری همین‌جاست. با مینی‌گیم‌های اختصاصی برند، لحظه‌های انتظار را به خرید بیشتر، بازگشت دوباره، معرفی دوستان و یادگیری تبدیل کن."],
    ["Eigene Kampagne erstellen","Kampagne erstellen","ساخت کمپین"],
    ["Demo spielen","Demo spielen","بازی آزمایشی"],
    ["Kein App Download. Kein kompliziertes Setup.","Kein App-Download. Keine komplizierte Einrichtung.","بدون نصب اپلیکیشن. بدون راه‌اندازی پیچیده."],
    ["Ein Link. Ein QR Code. Ein echtes Ziel.","Ein Link. Ein QR-Code. Ein echtes Ziel.","یک لینک. یک کد QR. یک هدف واقعی."],
    ["PLAY","SPIELEN","بازی"],
    ["ACT","HANDELN","اقدام"],
    ["RETURN","WIEDERKOMMEN","بازگشت"],
    ["BRAND EXPERIENCE","MARKENERLEBNIS","تجربه برند"],
    ["YOUR TIME, YOUR GAME","DEINE ZEIT, DEIN SPIEL","زمان تو، بازی تو"],
    ["A little","Ein kleiner","یک لحظه"],
    ["moment.","Moment.","کوتاه."],
    ["A big move.","Ein großer Schritt.","یک اتفاق بزرگ."],
    ["YOUR GOAL","DEIN ZIEL","هدف تو"],
    ["MORE RETURNS","MEHR WIEDERKEHR","بازگشت بیشتر"],
    ["REAL REFERRALS","ECHTE EMPFEHLUNGEN","معرفی واقعی"],
    ["SMART UPSELLS","PASSENDE ZUSATZKÄUFE","فروش مکمل هوشمند"],
    ["HAPPIER CUSTOMERS","ZUFRIEDENERE KUNDEN","مشتریان خوشحال‌تر"],
    ["PLAY NOW","JETZT SPIELEN","شروع بازی"],
    ["TURNING MINUTES INTO MOMENTUM — 2026","WARTEN WIRD ZU WIRKUNG — 2026","تبدیل انتظار به فرصت — ۲۰۲۶"],
    ["ATTENTION","AUFMERKSAMKEIT","توجه"],
    ["ACTION","AKTION","اقدام"],
    ["MEASUREMENT","MESSBARKEIT","اندازه‌گیری"],
    ["01 / THE SHIFT","۰۱ / DER WANDEL","۰۱ / تغییر"],
    ["BEYOND ENTERTAINMENT","MEHR ALS UNTERHALTUNG","فراتر از سرگرمی"],
    ["THE WHOLE POINT","DARUM GEHT'S","اصل ماجرا"],
    ["Not more","Nicht mehr","نه بازی"],
    ["games.","Spiele.","بیشتر."],
    ["More reasons.","Mehr Wirkung.","اثرگذاری بیشتر."],
    ["WAYS TO TURN","WEGE, SPIELEN","راه برای تبدیل"],
    ["PLAY INTO VALUE","IN WERT ZU WANDELN","بازی به ارزش"],
    ["Andere verkaufen Beschäftigung. Wir verbinden ein gutes Spiel mit einer konkreten Entscheidung deiner Kundinnen und Kunden.","Andere verkaufen Beschäftigung. Wir verbinden ein gutes Spiel mit einer konkreten Entscheidung deiner Kundinnen und Kunden.","بقیه فقط سرگرمی می‌فروشند. اینجا هر بازی به یک تصمیم واقعی مشتری وصل می‌شود."],
    ["Deshalb beginnt PWYW nicht bei der Spieleauswahl. Sondern bei der Frage:","PWYW beginnt deshalb nicht mit der Spielauswahl, sondern mit der Frage:","برای همین، نقطه شروع انتخاب بازی نیست؛ سؤال این است:"],
    ["Was soll danach passieren?","Was soll danach passieren?","بعد از بازی چه اتفاقی باید بیفتد؟"],
    ["Vier Wege entdecken","Vier Wege entdecken","دیدن چهار مسیر"],
    ["02 / CHOOSE YOUR OUTCOME","۰۲ / ZIEL WÄHLEN","۰۲ / انتخاب هدف"],
    ["ONE ENGINE. FOUR MISSIONS.","EINE ENGINE. VIER ZIELE.","یک موتور. چهار هدف."],
    ["FOUR PRODUCTS. ONE PLATFORM.","VIER PRODUKTE. EINE PLATTFORM.","چهار محصول. یک پلتفرم."],
    ["Purpose","Ziel","هدف"],
    ["before play.","vor Spiel.","پیش از بازی."],
    ["Erst das wirtschaftliche Ziel. Dann die passende Experience. Jedes Spiel kann in verschiedenen Kampagnen ganz anders wirken.","Erst das wirtschaftliche Ziel. Dann die passende Experience. Jedes Spiel kann in verschiedenen Kampagnen ganz anders wirken.","اول هدف تجاری را انتخاب کن؛ بعد تجربه بازی را بساز. یک بازی می‌تواند برای اهداف مختلف به شکل متفاوتی عمل کند."],
    ["Play to Upsell","Mehr verkaufen","بازی برای فروش مکمل"],
    ["Play to Return","Wiederkommen","بازی برای بازگشت"],
    ["Play to Refer","Weiterempfehlen","بازی برای معرفی دوستان"],
    ["Play to Learn","Wissen vermitteln","بازی برای یادگیری"],
    ["Zum perfekten Extra inspirieren.","Zum perfekten Extra inspirieren.","پیشنهاد محصول مکمل در زمان درست."],
    ["Aus einem Besuch werden zwei.","Aus einem Besuch werden zwei.","یک بازدید را به دو بازدید تبدیل کن."],
    ["Spielen, teilen, echte Empfehlung.","Spielen, teilen, echte Empfehlung.","بازی کن، به اشتراک بگذار، معرفی واقعی بساز."],
    ["Wissen, das wirklich ankommt.","Wissen, das wirklich ankommt.","اطلاعاتی که واقعاً به خاطر می‌ماند."],
    ["MEASURE","MESSEN","سنجش"],
    ["ZUSATZKÄUFE","ZUSATZKÄUFE","خرید مکمل"],
    ["WIEDERKEHR","WIEDERKEHR","بازگشت"],
    ["NEUKUNDEN","NEUKUNDEN","مشتری جدید"],
    ["VERSTÄNDNIS","VERSTÄNDNIS","یادگیری"],
    ["PWYW misst Interaktionen und bestätigte Einlösungen. Zusätzlicher Umsatz und Kostenersparnis müssen durch einen echten Praxistest nachgewiesen werden.","PWYW misst Interaktionen und bestätigte Einlösungen. Mehrumsatz und Einsparungen erfordern einen echten Praxistest.","این پلتفرم تعامل‌ها و استفاده‌های تأییدشده را اندازه می‌گیرد. افزایش واقعی درآمد یا کاهش هزینه به آزمون میدانی نیاز دارد."],
    ["03 / A WORLD OF YOUR OWN","۰۳ / DEINE MARKENWELT","۰۳ / دنیای اختصاصی تو"],
    ["BRANDS ARE NOT COLOR SWATCHES.","MEHR ALS NUR ANDERE FARBEN.","برند فقط تغییر رنگ نیست."],
    ["Not your logo","Nicht nur dein Logo","نه فقط لوگوی تو"],
    ["on our game.","auf einem Spiel.","روی بازی ما."],
    ["Your world.","Deine Welt.","دنیای خودت."],
    ["Deine Marke verändert die Bühne: Bildwelt, Charaktere, Objekte, Sprache, Animationen, Formen. Von Editorial Coffee bis Electric Garage.","Deine Marke verändert die Bühne: Bildwelt, Charaktere, Objekte, Sprache, Animationen und Formen.","برندت تمام دنیای بازی را تغییر می‌دهد: تصویر، کاراکتر، اشیا، زبان، حرکت و فرم؛ نه فقط رنگ."],
    ["01 / COFFEE WORLD","۰۱ / KAFFEEWELT","۰۱ / دنیای کافه"],
    ["02 / MOTOR WORLD","۰۲ / MOTORWELT","۰۲ / دنیای خودرو"],
    ["03 / ORGANIC WORLD","۰۳ / NATURWELT","۰۳ / دنیای طبیعت"],
    ["EXPLORE","ENTDECKEN","کشف"],
    ["Warm. Tactile. Slow mornings.","Warm. Sinnlich. Entspannt.","گرم، ملموس و آرام."],
    ["Electric. Kinetic. Fast.","Elektrisch. Dynamisch. Schnell.","برقی، پویا و سریع."],
    ["Gentle. Organic. Playful.","Sanft. Natürlich. Verspielt.","لطیف، طبیعی و بازیگوش."],
    ["04 / THE GAME ENGINE","۰۴ / DIE GAME ENGINE","۰۴ / موتور بازی"],
    ["PLAY ON YOUR PHONE","AUF DEM HANDY SPIELEN","بازی روی موبایل"],
    ["PLAYABLE. MOBILE-FIRST.","SPIELBAR. MOBIL OPTIMIERT.","واقعی و مناسب موبایل"],
    ["One engine.","Eine Engine.","یک موتور."],
    ["Ten ways to play.","Zehn Spielideen.","ده جور بازی."],
    ["Schnelle Mini Games, die ohne Download laufen. Jede Mechanik wird zur eigenen Marken Experience — mit Touch Steuerung, kurzer Spieldauer und klarem nächsten Schritt.","Schnelle Mini-Games ohne Download. Mit Touch-Steuerung, kurzer Spieldauer und klarer nächster Aktion.","مینی‌گیم‌های سریع و بدون نصب؛ با کنترل لمسی، زمان کوتاه و اقدامی مشخص پس از پایان بازی."],
    ["MEMORY","PAARE FINDEN","حافظه"],
    ["2048 MERGE","2048 KOMBINIEREN","ترکیب ۲۰۴۸"],
    ["ORBIT CATCH","ORBIT-FANG","شکار مدار"],
    ["BLOOM POP","BLÜTEN-POP","شکوفه‌ها"],
    ["NEON LANE","NEON-BAHN","مسیر نئون"],
    ["BLOCK BREAKER","BLOCKBRECHER","آجرشکن"],
    ["SNAKE","SCHLANGE","مار"],
    ["SKY HOP","HIMMELSSPRUNG","پرش آسمانی"],
    ["QUICK TAP","SCHNELL TIPPEN","ضربه سریع"],
    ["SEQUENCE","REIHENFOLGE","توالی"],
    ["REMEMBER","MERKEN","حفظ کن"],
    ["THINK","DENKEN","فکر کن"],
    ["CATCH","FANGEN","بگیر"],
    ["REACT","REAGIEREN","واکنش"],
    ["DODGE","AUSWEICHEN","جا خالی بده"],
    ["BOUNCE","ABPRALLEN","برگردان"],
    ["STEER","STEUERN","هدایت"],
    ["FLY","FLIEGEN","پرواز"],
    ["SPEED","TEMPO","سرعت"],
    ["FOCUS","FOKUS","تمرکز"],
    ["IT STARTS WITH ONE GOOD MINUTE.","ALLES BEGINNT MIT EINER GUTEN MINUTE.","همه‌چیز با یک دقیقه خوب شروع می‌شود."],
    ["Let's make","Lass uns","بیا این لحظه را"],
    ["it","sie",""],
    ["count.","nutzen.","ارزشمند کنیم."],
    ["Baue deine erste Branded Business Game Experience. Wähle ein Ziel, erschaffe deine Markenwelt und teile sie mit einem Link.","Baue deine eigene Marken-Spielwelt. Wähle ein Ziel und teile deine Kampagne mit einem Link.","اولین دنیای بازی اختصاصی برندت را بساز؛ یک هدف انتخاب کن و فقط با یک لینک به اشتراک بگذار."],
    ["Zum PWYW Studio","Zum PWYW Studio","ورود به استودیو"],
    ["SMALL GAMES. BIG INTENT.","KLEINE SPIELE. GROSSE WIRKUNG.","بازی کوچک. هدف بزرگ."],
    ["BY A+SOLUTION · PILOT 2026","VON A+SOLUTION · PILOT 2026","محصول A+SOLUTION · نسخه آزمایشی ۲۰۲۶"],
    ["SIGN IN","ANMELDEN","ورود"],
    ["SIGN IN ","ANMELDEN ","ورود "],
    ["CREATE AN ACCOUNT","KONTO ERSTELLEN","ساخت حساب"],
    ["CREATE ACCOUNT","KONTO ERSTELLEN","ساخت حساب"],
    ["Welcome back.","Willkommen zurück.","خوش برگشتی."],
    ["Your next idea starts here.","Deine nächste Idee beginnt hier.","ایده بعدی تو از اینجا شروع می‌شود."],
    ["One studio. Four business goals. Ten games.","Ein Studio. Vier Geschäftsziele. Zehn Spiele.","یک استودیو. چهار هدف تجاری. ده بازی."],
    ["YOUR EMAIL","DEINE E-MAIL","ایمیل شما"],
    ["EMAIL","E-MAIL","ایمیل"],
    ["PASSWORD","PASSWORT","رمز عبور"],
    ["At least 10 characters","Mindestens 10 Zeichen","حداقل ۱۰ نویسه"],
    ["At least 14 characters","Mindestens 14 Zeichen","حداقل ۱۴ نویسه"],
    ["Pilot studio. No credit card, no promises of incremental revenue.","Pilotstudio. Keine Kreditkarte. Keine unbelegten Umsatzversprechen.","نسخه آزمایشی؛ بدون نیاز به کارت بانکی و بدون وعده غیرواقعی درآمد."],
    ["YOUR CAMPAIGN STUDIO / PWYW®","DEIN KAMPAGNENSTUDIO / PWYW®","استودیوی کمپین تو / PWYW®"],
    ["MAKE","MACH","بساز"],
    ["YOUR BRAND","DEINE MARKE","برندت را"],
    ["PLAY.","SPIELBAR.","بازی‌کردنی."],
    ["Don’t start with a game. Start with what you want customers to do.","Starte nicht mit dem Spiel. Starte mit deinem Kundenziel.","از بازی شروع نکن؛ از کاری شروع کن که می‌خواهی مشتری انجام دهد."],
    ["BRAND LAB / 01","MARKENLABOR / 01","آزمایشگاه برند / ۰۱"],
    ["PRIVATE PILOT / NO BILLING","PRIVATER PILOT / KEINE ABRECHNUNG","آزمایشی / بدون پرداخت"],
    ["LOG OUT","ABMELDEN","خروج"],
    ["LOG OUT ↗","ABMELDEN ↗","خروج ↗"],
    ["MY BRAND WORLDS","MEINE MARKENWELTEN","دنیای برندهای من"],
    ["Create a new brand","Neue Marke anlegen","ساخت برند جدید"],
    ["EXPLORE THE WEBSITE ↗","WEBSITE ENTDECKEN ↗","مشاهده وب‌سایت ↗"],
    ["THE EXPERIENCE BUILDER / GOAL FIRST","EXPERIENCE BUILDER / ZIEL ZUERST","سازنده تجربه / اول هدف"],
    ["First, pick an outcome.","Wähle zuerst dein Ziel.","اول یک هدف انتخاب کن."],
    ["Not the game. The action you want your customers to take.","Nicht das Spiel. Sondern die Aktion, die Kunden ausführen sollen.","نه نام بازی؛ کاری که می‌خواهی مشتری انجام بدهد."],
    ["OPEN LIVE LOUNGE ↗","SPIELWELT ÖFFNEN ↗","باز کردن بازی ↗"],
    ["STEP 01 / BUSINESS OBJECTIVE","SCHRITT 01 / GESCHÄFTSZIEL","مرحله ۰۱ / هدف تجاری"],
    ["WHAT SHOULD PLAY DO?","WAS SOLL DAS SPIEL BEWIRKEN?","بازی چه نتیجه‌ای داشته باشد؟"],
    ["Choose a customer outcome. Every game uses the same underlying game engine. The journey and measurement change with your objective.","Wähle ein Kundenziel. Jedes Spiel nutzt dieselbe Engine. Erlebnis und Messung richten sich nach deinem Ziel.","یک نتیجه مشخص انتخاب کن. تمام بازی‌ها از یک موتور مشترک استفاده می‌کنند، اما مسیر مشتری و سنجش متناسب با هدف تغییر می‌کند."],
    ["GROW THE ORDER","BESTELLWERT ERHÖHEN","افزایش مبلغ خرید"],
    ["KEEP THEM COMING","KUNDEN ZURÜCKHOLEN","بازگشت مشتری"],
    ["BRING A FRIEND","FREUNDE EINLADEN","دعوت از دوستان"],
    ["TELL IT BETTER","BESSER ERKLÄREN","انتقال بهتر اطلاعات"],
    ["PLAY TO UPSELL ↗","MEHR VERKAUFEN ↗","فروش مکمل ↗"],
    ["PLAY TO RETURN ↗","WIEDERKEHR ↗","بازگشت ↗"],
    ["PLAY TO REFER ↗","EMPFEHLUNGEN ↗","معرفی دوستان ↗"],
    ["PLAY TO LEARN ↗","WISSEN ↗","یادگیری ↗"],
    ["Suggest an add-on after the game","Nach dem Spiel passendes Extra empfehlen","پیشنهاد محصول مکمل پس از بازی"],
    ["Make a return visit worth remembering","Den nächsten Besuch attraktiv machen","ایجاد انگیزه برای بازگشت"],
    ["Reward a verified recommendation","Bestätigte Empfehlungen belohnen","پاداش برای معرفی تأییدشده"],
    ["Replace repetitive instructions with play","Anleitungen spielerisch vermitteln","آموزش اطلاعات تکراری با بازی"],
    ["STEP 02 / IDENTITY","SCHRITT 02 / IDENTITÄT","مرحله ۰۲ / هویت برند"],
    ["LET’S MAKE IT YOURS.","MACH ES ZU DEINER WELT.","دنیای خودت را بساز."],
    ["Your logo is only the beginning. The layout, typography, game objects, patterns and tone should match the personality of your place.","Dein Logo ist erst der Anfang. Layout, Schrift, Spielobjekte, Muster und Ton müssen zu deiner Marke passen.","لوگو فقط آغاز کار است. چیدمان، تایپوگرافی، اشیای بازی و لحن باید با شخصیت کسب‌وکارت هماهنگ باشند."],
    ["BUSINESS NAME","NAME DES BETRIEBS","نام کسب‌وکار"],
    ["TYPE OF PLACE","BRANCHE","نوع کسب‌وکار"],
    ["WELCOME LINE","WILLKOMMENSTEXT","متن خوشامدگویی"],
    ["PUBLIC URL NAME","ÖFFENTLICHER URL-NAME","شناسه لینک عمومی"],
    ["YOUR ACCENT COLOR","AKZENTFARBE","رنگ هویت"],
    ["BRAND LOGO (PNG, JPEG OR WEBP)","MARKENLOGO (PNG, JPEG ODER WEBP)","لوگوی برند (PNG، JPEG یا WEBP)"],
    ["Your public URL is permanent after first save. Brand assets must belong to you.","Deine öffentliche URL bleibt nach dem ersten Speichern bestehen. Verwende nur eigene Markenmaterialien.","پس از نخستین ذخیره، نشانی عمومی ثابت می‌ماند. فقط از محتوایی استفاده کن که اجازه استفاده از آن را داری."],
    ["Café","Café","کافه"],
    ["Restaurant","Restaurant","رستوران"],
    ["Beauty / hair studio","Beauty- / Friseurstudio","زیبایی و آرایشگاه"],
    ["Garage / automotive","Werkstatt / Auto","تعمیرگاه و خودرو"],
    ["Hotel / travel","Hotel / Reisen","هتل و سفر"],
    ["Wellness / health","Wellness / Gesundheit","سلامت و تندرستی"],
    ["Other","Sonstiges","سایر"],
    ["BRAND WORLD / ASSET PACK","MARKENWELT / MEDIEN","دنیای برند / فایل‌های گرافیکی"],
    ["BACKGROUND SCENE · PHOTO OR ILLUSTRATION","HINTERGRUNDBILD · FOTO ODER ILLUSTRATION","صحنه پس‌زمینه · عکس یا تصویرسازی"],
    ["Creates a venue-specific game lounge setting. JPG / PNG / WebP, max 2 MB.","Erstellt eine individuelle Spielwelt. JPG / PNG / WebP, max. 2 MB.","یک محیط بازی ویژه کسب‌وکار می‌سازد. JPG / PNG / WebP، حداکثر ۲ مگابایت."],
    ["BRANDED GAME OBJECT · PRODUCT OR MASCOT","SPIELOBJEKT · PRODUKT ODER MASKOTTCHEN","شیء بازی اختصاصی · محصول یا شخصیت برند"],
    ["This object appears inside mini-games as a collectible or matched card.","Dieses Objekt erscheint im Spiel als Sammelobjekt oder Kartenmotiv.","این شیء در مینی‌گیم‌ها به عنوان آیتم قابل جمع‌آوری یا کارت ظاهر می‌شود."],
    ["Make every venue a different world: bring an approved background image and a game object to customize the actual games, not just the header.","Jeder Betrieb bekommt eine eigene Welt: Passe mit Hintergrund und Spielobjekt das ganze Spiel an, nicht nur den Kopfbereich.","هر کسب‌وکار دنیای خود را دارد؛ با تصویر پس‌زمینه و شیء بازی، خود بازی را شخصی‌سازی کن نه فقط سربرگ را."],
    ["STEP 03 / ART DIRECTION","SCHRITT 03 / ART DIRECTION","مرحله ۰۳ / سبک بصری"],
    ["CHOOSE YOUR WORLD.","WÄHLE DEINE WELT.","دنیایت را انتخاب کن."],
    ["Eight directions, each with different typography, scene treatment, shapes and player interface.","Acht Stilwelten mit eigenen Schriften, Bildsprachen, Formen und Spieloberflächen.","هشت سبک مستقل با تایپوگرافی، فضای بصری، فرم‌ها و رابط بازی متفاوت."],
    ["EDITORIAL","EDITORIAL","ادیتوریال"],
    ["Editorial","Editorial","مجله‌ای"],
    ["Arcade","Arcade","آرکید"],
    ["Organic","Organisch","ارگانیک"],
    ["Bold","Markant","جسور"],
    ["Luxury","Luxuriös","لوکس"],
    ["Future","Futuristisch","آینده‌نگر"],
    ["Soft","Sanft","لطیف"],
    ["Classic","Klassisch","کلاسیک"],
    ["SAVE BRAND WORLD","MARKENWELT SPEICHERN","ذخیره دنیای برند"],
    ["STEP 04 / THE ACTION AFTER PLAY","SCHRITT 04 / AKTION NACH DEM SPIEL","مرحله ۰۴ / اقدام پس از بازی"],
    ["CAMPAIGN TITLE","KAMPAGNENTITEL","عنوان کمپین"],
    ["GAME EXPERIENCE","SPIELERLEBNIS","نوع بازی"],
    ["PRODUCT OR SERVICE","PRODUKT ODER DIENSTLEISTUNG","محصول یا خدمت"],
    ["CALL TO ACTION","HANDLUNGSAUFFORDERUNG","دعوت به اقدام"],
    ["OFFER OR INSTRUCTION","ANGEBOT ODER HINWEIS","پیشنهاد یا راهنما"],
    ["DESTINATION URL (OPTIONAL, HTTPS)","ZIELLINK (OPTIONAL, HTTPS)","لینک مقصد (اختیاری، HTTPS)"],
    ["GROSS CONTRIBUTION PER VERIFIED ACTION (EUR)","BRUTTOBEITRAG PRO BESTÄTIGTER AKTION (EUR)","مبلغ ناخالص هر اقدام تأییدشده (یورو)"],
    ["REWARD COST PER REDEMPTION (EUR)","PRÄMIENKOSTEN PRO EINLÖSUNG (EUR)","هزینه پاداش هر استفاده (یورو)"],
    ["INTRO TO THE CUSTOMER","EINFÜHRUNG FÜR KUNDEN","متن معرفی برای مشتری"],
    ["PUBLISH THIS CAMPAIGN","KAMPAGNE VERÖFFENTLICHEN","انتشار کمپین"],
    ["PLAY TO LEARN / INTERACTIVE KNOWLEDGE","WISSEN / INTERAKTIVER LERNTEST","بازی برای یادگیری / آزمون تعاملی"],
    ["ONE USEFUL QUESTION","EINE WICHTIGE FRAGE","یک سؤال کاربردی"],
    ["ANSWER A","ANTWORT A","گزینه الف"],
    ["ANSWER B","ANTWORT B","گزینه ب"],
    ["ANSWER C","ANTWORT C","گزینه پ"],
    ["CORRECT ANSWER","RICHTIGE ANTWORT","پاسخ درست"],
    ["Your instructions become a one-question interactive check after the game. This measures recall, not actual reductions in staff workload.","Nach dem Spiel wird eine Frage gestellt. Das prüft Verständnis, nicht nachgewiesene Personaleinsparung.","پس از بازی، یک پرسش برای بررسی یادگیری نمایش داده می‌شود؛ نه برای اثبات کاهش هزینه کارکنان."],
    ["IMPORTANT:","WICHTIG:","مهم:"],
    ["All campaign totals are descriptive. Purchase lift and saved staff time require a real comparison group or independent business data. Unverified game scores never unlock monetary rewards.","Kampagnenzahlen sind beschreibend. Mehrumsatz und Zeitersparnis müssen gesondert geprüft werden. Spielpunkte lösen nie Geldprämien aus.","آمار کمپین صرفاً توصیفی است. رشد فروش و صرفه‌جویی به مقایسه واقعی نیاز دارد. امتیاز بازی به تنهایی پاداش مالی ایجاد نمی‌کند."],
    ["LIVE / PILOT INSTRUMENTATION","LIVE / PILOTMESSUNG","زنده / آمار نسخه آزمایشی"],
    ["DOES IT WORK?","WIRKT ES?","نتیجه می‌دهد؟"],
    ["Anonymous game events plus staff-confirmed claims. Not automatically proven incremental profit.","Anonyme Spielereignisse und vom Personal bestätigte Einlösungen. Kein automatischer Nachweis von Mehrgewinn.","رویدادهای بازی ناشناس و پاداش‌های تأییدشده توسط کارکنان؛ نه اثبات سود افزوده."],
    ["VISITS","BESUCHE","بازدیدها"],
    ["GAME STARTS","SPIELSTARTS","شروع بازی"],
    ["COMPLETIONS","ABSCHLÜSSE","پایان بازی"],
    ["YOUR BRAND LOUNGE QR","QR DEINER MARKENWELT","کد QR دنیای برند"],
    ["DOWNLOAD QR · SVG ↓","QR ALS SVG LADEN ↓","دریافت QR · SVG ↓"],
    ["Visitors can choose an experience. To share a particular business goal, use its direct link.","Besucher wählen ein Erlebnis. Teile für ein bestimmtes Ziel den direkten Kampagnenlink.","مشتری می‌تواند بازی را انتخاب کند. برای یک هدف خاص از لینک مستقیم کمپین استفاده کن."],
    ["OPEN CURRENT CAMPAIGN ↗","AKTUELLE KAMPAGNE ÖFFNEN ↗","باز کردن کمپین فعلی ↗"],
    ["STAFF CONFIRMATION / REAL BUSINESS ACTIONS","PERSONALBESTÄTIGUNG / ECHTE KUNDENAKTIONEN","تأیید کارکنان / اقدامات واقعی مشتری"],
    ["VERIFY A CLAIM","EINLÖSUNG BESTÄTIGEN","تأیید درخواست پاداش"],
    ["Enter a claim code only when the customer actually purchased, returned or referred a buyer. Self-reported financial value is not POS verification.","Code nur bestätigen, wenn der Kunde wirklich gekauft, wiedergekommen oder jemanden empfohlen hat.","کد را فقط وقتی تأیید کن که خرید، بازگشت یا معرفی واقعاً اتفاق افتاده باشد."],
    ["VERIFY ↗","BESTÄTIGEN ↗","تأیید ↗"],
    ["Claim code","Einlösecode","کد پاداش"],
    ["Verified contribution","Bestätigter Beitrag","مبلغ تأییدشده"],
    ["LIVE DIRECTION / YOUR WORLD","LIVE-VORSCHAU / DEINE WELT","پیش‌نمایش زنده / دنیای تو"],
    ["NOW PLAYING / YOUR BRAND","JETZT SPIELEN / DEINE MARKE","اکنون در حال بازی / برند تو"],
    ["YOUR","DEINE","برند"],
    ["BRAND.","MARKE.","تو."],
    ["A little fun while you wait.","Ein bisschen Spielspaß beim Warten.","کمی بازی در زمان انتظار."],
    ["This is a direction preview, not a screenshot of the full game. Launch the lounge to play all ten.","Das ist eine Stilvorschau, kein Spiel-Screenshot. Starte die Markenwelt für alle zehn Spiele.","این فقط پیش‌نمایش سبک است؛ برای تجربه هر ده بازی وارد دنیای بازی شو."],
    ["AI is optional: only use it where it helps generate a good brand voice or content safely. Game runtime never waits for AI.","KI ist optional und hilft nur bei Textideen. Die Spiele laufen unabhängig davon.","هوش مصنوعی اختیاری است و تنها برای ایده‌پردازی متن به کار می‌رود؛ اجرای بازی به آن وابسته نیست."],
    ["✦ SUGGEST A WELCOME LINE","✦ WILLKOMMENSTEXT VORSCHLAGEN","✦ پیشنهاد متن خوشامدگویی"],
    ["PRIVATE / ACCOUNT SECURITY","PRIVAT / KONTO-SICHERHEIT","خصوصی / امنیت حساب"],
    ["YOUR ACCOUNT.","DEIN KONTO.","حساب کاربری تو."],
    ["Change your initial password after the first login. All existing sessions will be revoked.","Ändere dein Startpasswort nach der ersten Anmeldung. Alle Sitzungen werden beendet.","پس از نخستین ورود رمزت را تغییر بده. همه نشست‌های فعال بسته می‌شوند."],
    ["CURRENT PASSWORD","AKTUELLES PASSWORT","رمز فعلی"],
    ["NEW PASSWORD","NEUES PASSWORT","رمز جدید"],
    ["UPDATE PASSWORD","PASSWORT ÄNDERN","تغییر رمز"],
    ["PWYW® BY A+SOLUTION · PURPOSE FIRST · THE ARCADE FOLLOWS.","PWYW® VON A+SOLUTION · ZIEL ZUERST · DANN DAS SPIEL.","PWYW® از A+SOLUTION · اول هدف، بعد بازی."],
    ["THE EXPERIENCE BUILDER / GOAL FIRST","EXPERIENCE BUILDER / ZIEL ZUERST","سازنده تجربه / اول هدف"],
    ["YOUR BUSINESS","DEIN BETRIEB","کسب‌وکار تو"],
    ["Business logo","Firmenlogo","لوگوی کسب‌وکار"],
    ["LOADING YOUR UNIVERSE","DEINE SPIELWELT LÄDT","در حال بارگذاری دنیای تو"],
    ["Back to game lounge","Zurück zur Spielwelt","بازگشت به بازی‌ها"],
    ["Toggle sound","Ton umschalten","تغییر وضعیت صدا"],
    ["THIS MOMENT HAS A PURPOSE / 01","DIESER MOMENT HAT EIN ZIEL / 01","این لحظه یک هدف دارد / ۰۱"],
    ["A LITTLE","EIN KLEINES","یک بازی"],
    ["PLAY.","SPIEL.","کوچک."],
    ["A LOT MORE.","VIEL MEHR.","یک نتیجه بزرگ."],
    ["Choose a business objective","Geschäftsziel wählen","انتخاب هدف تجاری"],
    ["01 UPSELL","۰۱ MEHR VERKAUFEN","۰۱ فروش مکمل"],
    ["02 RETURN","۰۲ WIEDERKEHR","۰۲ بازگشت"],
    ["03 REFER","۰۳ EMPFEHLEN","۰۳ معرفی"],
    ["04 LEARN","۰۴ LERNEN","۰۴ یادگیری"],
    ["Unlock the perfect pairing after a quick game.","Nach einem kurzen Spiel ein passendes Extra entdecken.","بعد از یک بازی کوتاه، یک پیشنهاد مکمل مناسب دریافت کن."],
    ["CHOOSE YOUR CHALLENGE / 10 WORLDS","WÄHLE DEIN SPIEL / 10 WELTEN","بازی خودت را انتخاب کن / ۱۰ دنیا"],
    ["Orbit Catch","Orbit-Fang","شکار مدار"],
    ["Memory Match","Paare finden","بازی حافظه"],
    ["Merge Lab 2048","Merge-Labor 2048","آزمایشگاه ۲۰۴۸"],
    ["Neon Lane","Neon-Bahn","مسیر نئون"],
    ["Bloom Pop","Blüten-Pop","شکوفه‌ها"],
    ["Block Breaker","Blockbrecher","آجرشکن"],
    ["Snake Circuit","Schlangen-Parcours","مسیر مار"],
    ["Sky Hop","Himmelssprung","پرش آسمانی"],
    ["Quick Tap","Schnell tippen","ضربه سریع"],
    ["Sequence","Reihenfolge","توالی"],
    ["MATCH / 1–2 MIN","PAARE / 1–2 MIN","حافظه / ۱ تا ۲ دقیقه"],
    ["THINK / 90 SEC","DENKEN / 90 SEK","فکر کن / ۹۰ ثانیه"],
    ["REFLEX / 30 SEC","REFLEX / 30 SEK","واکنش / ۳۰ ثانیه"],
    ["CLASSIC / 54 SEC","KLASSIK / 54 SEK","کلاسیک / ۵۴ ثانیه"],
    ["ARCADE / 65 SEC","ARCADE / 65 SEK","آرکید / ۶۵ ثانیه"],
    ["FLY / 52 SEC","FLIEGEN / 52 SEK","پرواز / ۵۲ ثانیه"],
    ["CATCH / 45 SEC","FANGEN / 45 SEK","گرفتن / ۴۵ ثانیه"],
    ["POP / 40 SEC","REAKTION / 40 SEK","واکنش / ۴۰ ثانیه"],
    ["ACTION / 48 SEC","ACTION / 48 SEK","هیجان / ۴۸ ثانیه"],
    ["RECALL / 58 SEC","MERKEN / 58 SEK","یادآوری / ۵۸ ثانیه"],
    ["↻ RESTART","↻ NEU STARTEN","↻ شروع دوباره"],
    ["SCORE","PUNKTE","امتیاز"],
    ["TIME","ZEIT","زمان"],
    ["MOVES","ZÜGE","حرکت"],
    ["LEFT","ÜBRIG","باقی‌مانده"],
    ["Tap to play.","Tippen und spielen.","برای بازی لمس کن."],
    ["BUILT FOR THIS MOMENT.","FÜR DIESEN MOMENT GEMACHT.","ساخته‌شده برای این لحظه."],
    ["A LITTLE POWERED BY PWYW®","MIT PWYW®","قدرت‌گرفته از PWYW®"],
    ["THE MOMENT CONTINUES / PWYW®","DER MOMENT GEHT WEITER / PWYW®","لحظه ادامه دارد / PWYW®"],
    ["NICE PLAY.","GUT GESPIELT.","عالی بازی کردی."],
    ["That's one for the books.","Das hat Spaß gemacht!","چه بازی خوبی!"],
    ["AFTER THE GAME","NACH DEM SPIEL","پس از بازی"],
    ["Your next move.","Dein nächster Schritt.","قدم بعدی تو."],
    ["A small reward, a clear next step.","Eine kleine Belohnung. Ein klarer nächster Schritt.","یک پاداش کوچک، یک قدم مشخص."],
    ["GET MY CODE ↗","CODE HOLEN ↗","دریافت کد ↗"],
    ["OPEN THE OFFER ↗","ANGEBOT ANSEHEN ↗","مشاهده پیشنهاد ↗"],
    ["Share this little challenge. A reward is only counted if your friend becomes a verified customer.","Teile die Herausforderung. Eine Belohnung zählt nur bei bestätigtem Neukunden.","چالش را با دوستت به اشتراک بگذار. پاداش زمانی ثبت می‌شود که او مشتری واقعی و تأییدشده شود."],
    ["SHARE LINK ↗","LINK TEILEN ↗","اشتراک لینک ↗"],
    ["COPY LINK","LINK KOPIEREN","کپی لینک"],
    ["Rewards are subject to merchant terms.","Es gelten die Bedingungen des Anbieters.","پاداش‌ها تابع شرایط کسب‌وکار هستند."],
    ["WEEKLY SCOREBOARD (NICKNAME OPTIONAL)","WOCHENBESTENLISTE (NAME OPTIONAL)","جدول امتیاز هفتگی (نام اختیاری)"],
    ["Nickname","Spitzname","نام مستعار"],
    ["POST SCORE ↗","PUNKTE EINTRAGEN ↗","ثبت امتیاز ↗"],
    ["CHOOSE ANOTHER GAME","ANDERES SPIEL WÄHLEN","انتخاب بازی دیگر"],
    ["CLOSE RESULT","ERGEBNIS SCHLIESSEN","بستن نتیجه"],
    ["This experience has not been published by the business yet.","Dieses Erlebnis wurde noch nicht veröffentlicht.","این تجربه هنوز توسط کسب‌وکار منتشر نشده است."],
    ["A LITTLE PLAY. A LOT MORE.","EIN KLEINES SPIEL. VIEL MEHR.","بازی کوتاه، نتیجه بزرگ."],
    ["Codes must be verified by the business. No prize is awarded for a game score.","Codes müssen vom Betrieb bestätigt werden. Punkte allein bringen keine Prämie.","کدها باید توسط کسب‌وکار تأیید شوند؛ امتیاز بازی به‌تنهایی پاداش ندارد."],
    ["Choose the best answer. The result helps you understand the service, not win a prize.","Wähle die beste Antwort. Das Ergebnis dient dem Verständnis, nicht der Gewinnvergabe.","بهترین پاسخ را انتخاب کن. هدف، یادگیری است نه برنده شدن جایزه."],
    ["Correct! You're prepared.","Richtig! Du bist vorbereitet.","درست است! آماده‌ای."],
    ["Not quite. Ask the team for clarification before proceeding.","Noch nicht ganz. Bitte frag das Team nach.","کاملاً درست نیست. قبل از ادامه از کارکنان راهنمایی بگیر."],
    ["Knowledge check complete. A correct answer does not establish staff-time savings.","Wissenstest beendet. Das belegt keine Personalzeiteinsparung.","آزمون تمام شد. پاسخ درست به معنای صرفه‌جویی قطعی در وقت کارکنان نیست."],
    ["Quiz couldn't be recorded. Please try again.","Antwort konnte nicht gespeichert werden. Erneut versuchen.","ثبت پاسخ ممکن نشد. دوباره تلاش کن."],
    ["Ask the team about your next step.","Frag das Team nach deinem nächsten Schritt.","درباره قدم بعدی از کارکنان بپرس."],
    ["No active campaign. Games remain free to play.","Keine aktive Kampagne. Spielen bleibt kostenlos.","کمپین فعالی نیست. بازی همچنان رایگان است."],
    ["Completion means this instruction was viewed. It does not prove fewer staff questions.","Abschluss bedeutet nur, dass die Anleitung angesehen wurde.","پایان بازی فقط دیدن راهنما را نشان می‌دهد، نه کاهش قطعی پرسش‌ها."],
    ["Lightning quick! Go again?","Blitzschnell! Noch mal?","برق‌آسا بود! دوباره بازی می‌کنی؟"],
    ["Beautifully remembered. Fancy another?","Super gemerkt! Noch eine Runde?","چه حافظه‌ای! یک دور دیگر؟"],
    ["You've got a way with numbers.","Zahlen liegen dir!","با اعداد عالی کار می‌کنی!"],
    ["Your name could be here. Be the first!","Hier könnte dein Name stehen. Sei der Erste!","اسم تو می‌تواند اینجا باشد؛ نفر اول باش!"],
    ["Find all 8 matching pairs. Fewer moves = bigger score.","Finde 8 Paare. Weniger Züge bringen mehr Punkte.","۸ جفت یکسان را پیدا کن. هرچه حرکت کمتر، امتیاز بیشتر."],
    ["Swipe the board to merge equal numbers. Arrow keys work too. 90-second challenge.","Wische, um gleiche Zahlen zu vereinen. Pfeiltasten funktionieren auch. 90 Sekunden.","اعداد یکسان را با کشیدن انگشت ترکیب کن. کلیدهای جهت هم کار می‌کنند. ۹۰ ثانیه وقت داری."],
    ["Tap the glowing spark as fast as you can. 30 seconds. Wrong taps cost 25 points.","Tippe den leuchtenden Funken so schnell wie möglich. 30 Sekunden. Fehlklicks kosten 25 Punkte.","در ۳۰ ثانیه هرچه سریع‌تر روی جرقه بزن. هر ضربه اشتباه ۲۵ امتیاز کم می‌کند."],
    ["THANK YOU FOR READING","DANKE FÜRS LESEN","ممنون که خواندی"],
    ["Could not create a code. Please try again.","Code konnte nicht erstellt werden. Bitte erneut versuchen.","ساخت کد ممکن نشد. دوباره تلاش کن."],
    ["COPIED ✓","KOPIERT ✓","کپی شد ✓"],
    ["COPY NOT AVAILABLE","KOPIEREN NICHT MÖGLICH","امکان کپی نیست"],
    ["This game lounge is not available.","Diese Spielwelt ist nicht verfügbar.","این دنیای بازی در دسترس نیست."],
    ["Sound enabled","Ton an","صدا روشن"],
    ["Sound muted","Ton aus","صدا خاموش"],
    ["ADMINISTRATOR SIGN IN","ADMINISTRATOR-ANMELDUNG","ورود مدیر سیستم"],
    ["PWYW / PRIVATE OPERATIONS / v1","PWYW / INTERNE VERWALTUNG / v1","PWYW / مدیریت خصوصی / نسخه ۱"],
    ["THE","DER","اتاق"],
    ["CONTROL","KONTROLL","کنترل"],
    ["ROOM","RAUM",""],
    [" / CONTROL ROOM"," / KONTROLLRAUM"," / پنل مدیریت"],
    ["BRAND STUDIO ↗","MARKENSTUDIO ↗","استودیوی برند ↗"],
    ["Independent view of business accounts, branded campaigns, game sessions and manually confirmed outcomes.","Übersicht zu Geschäftskonten, Markenkampagnen, Spielsessions und manuell bestätigten Ergebnissen.","نمای مستقلی از حساب‌های تجاری، کمپین‌ها، بازی‌ها و نتایج تأییدشده توسط کارکنان."],
    ["ENTER CONTROL ROOM","KONTROLLRAUM ÖFFNEN","ورود به پنل مدیریت"],
    ["↻ REFRESH","↻ AKTUALISIEREN","↻ تازه‌سازی"],
    ["01 / ACCOUNT DIRECTORY","01 / KONTENÜBERSICHT","۰۱ / حساب‌های کاربری"],
    ["BUSINESS OWNERS.","GESCHÄFTSKONTEN.","صاحبان کسب‌وکار."],
    ["02 / BRAND WORLDS","02 / MARKENWELTEN","۰۲ / دنیای برندها"],
    ["LIVE BRANDS.","AKTIVE MARKEN.","برندهای فعال."],
    ["03 / OWNERSHIP","03 / KONTOSICHERHEIT","۰۳ / امنیت حساب"],
    ["CHANGE PASSWORD.","PASSWORT ÄNDERN.","تغییر رمز عبور."],
    ["Current sessions will be revoked. Sign in again with your new password.","Alle Sitzungen werden beendet. Melde dich mit dem neuen Passwort erneut an.","همه نشست‌ها بسته می‌شوند. با رمز جدید دوباره وارد شو."],
    ["CURRENT","AKTUELL","فعلی"],
    ["NEW PASSWORD","NEUES PASSWORT","رمز جدید"],
    ["ROTATE PASSWORD ↗","PASSWORT ÄNDERN ↗","تغییر رمز ↗"],
    ["Revenue-related values are merchant declared. Game starts, claims and redemptions are not an incrementality study.","Umsatzzahlen stammen vom Händler. Spielstarts und Einlösungen beweisen keinen zusätzlichen Umsatz.","مبالغ درآمد را کسب‌وکار اعلام می‌کند. شروع بازی‌ها و استفاده از پاداش، اثبات فروش افزوده نیست."],
    ["NO RECORDS YET","NOCH KEINE EINTRÄGE","هنوز داده‌ای نیست"],
    ["SIGNED IN AS","ANGEMELDET ALS","ورود با حساب"],
    ["BUSINESS ACCOUNTS","GESCHÄFTSKONTEN","حساب‌های تجاری"],
    ["BRAND WORLDS","MARKENWELTEN","دنیای برندها"],
    ["ACTIVE CAMPAIGNS","AKTIVE KAMPAGNEN","کمپین‌های فعال"],
    ["GAME STARTS · 30D","SPIELSTARTS · 30 TAGE","شروع بازی · ۳۰ روز"],
    ["CLAIMS ISSUED","AUSGEGEBENE CODES","کدهای صادرشده"],
    ["VERIFIED REDEMPTIONS","BESTÄTIGTE EINLÖSUNGEN","پاداش‌های تأییدشده"],
    ["ROLE","ROLLE","نقش"],
    ["BRANDS","MARKEN","برندها"],
    ["BUSINESS","BETRIEB","کسب‌وکار"],
    ["OWNER","INHABER","مالک"],
    ["GAMES","SPIELE","بازی‌ها"],
    ["REDEEMED","EINGELÖST","استفاده‌شده"],
    ["Changed. Please sign in again.","Geändert. Bitte neu anmelden.","رمز تغییر کرد. دوباره وارد شو."],
    ["SIGNING IN...","ANMELDUNG LÄUFT ...","در حال ورود..."],
    ["This account is not an administrator.","Dieses Konto hat keine Administratorrechte.","این حساب دسترسی مدیریت ندارد."],
    ["Request failed","Anfrage fehlgeschlagen","درخواست ناموفق بود"],
    ["Invalid email or password","E-Mail oder Passwort falsch","ایمیل یا رمز عبور اشتباه است"],
    ["Session expired","Sitzung abgelaufen","نشست منقضی شده است"],
    ["Please sign in","Bitte anmelden","لطفاً وارد شو"],
    ["Too many requests; try again later","Zu viele Versuche. Bitte später erneut probieren.","تعداد درخواست‌ها زیاد است. بعداً دوباره امتحان کن."],
    ["Incorrect current password","Aktuelles Passwort ist falsch","رمز فعلی اشتباه است"],
    ["Password changed; sign in again.","Passwort geändert. Bitte erneut anmelden.","رمز تغییر کرد. دوباره وارد شو."],
    ["Your brands appear here.","Deine Marken erscheinen hier.","برندهای تو اینجا دیده می‌شوند."],
    ["Upload a background scene and game object to make a world your own.","Lade ein Hintergrundbild und Spielobjekt hoch, um deine Welt zu gestalten.","برای ساخت دنیای خودت، تصویر پس‌زمینه و شیء بازی را بارگذاری کن."],
    ["Build an action-first campaign and share a world that feels like you.","Erstelle eine Kampagne mit klarem Ziel und teile deine Markenwelt.","کمپینی هدفمند بساز و دنیای برندت را به اشتراک بگذار."],
    ["Saving...","Wird gespeichert ...","در حال ذخیره..."],
    ["Publishing campaign...","Kampagne wird veröffentlicht ...","در حال انتشار کمپین..."],
    ["Save a brand first.","Speichere zuerst eine Marke.","اول برندت را ذخیره کن."],
    ["Brand saved. Set up your first business objective below.","Marke gespeichert. Richte jetzt dein erstes Ziel ein.","برند ذخیره شد. حالا اولین هدف تجاری را تنظیم کن."],
    ["Live. Your campaign is ready to share.","Live! Deine Kampagne kann geteilt werden.","کمپین منتشر شد و آماده اشتراک‌گذاری است."],
    ["Publish a campaign to begin tracking real customer actions.","Veröffentliche eine Kampagne, um Kundenaktionen zu erfassen.","برای ثبت اقدامات واقعی مشتری، یک کمپین منتشر کن."],
    ["Marked as verified. This requires a real customer action.","Als bestätigt markiert. Eine echte Kundenaktion ist erforderlich.","تأیید شد؛ این تأیید باید بر اساس اقدام واقعی مشتری باشد."],
    ["Not verified.","Nicht bestätigt.","تأیید نشد."],
    ["Save a brand to use the optional assistant.","Speichere zuerst eine Marke, um den Assistenten zu nutzen.","برای استفاده از دستیار، ابتدا برند را ذخیره کن."],
    ["Play, then find the extra that makes the moment better.","Spiele und entdecke danach ein passendes Extra.","بازی کن و بعد یک پیشنهاد مکمل پیدا کن."],
    ["Perfect pairing","Perfekte Ergänzung","ترکیب ایده‌آل"],
    ["Show me the pairing","Ergänzung anzeigen","نمایش پیشنهاد"],
    ["Discover a complementary extra","Passendes Extra entdecken","کشف محصول مکمل"],
    ["Signature pairing","Empfohlenes Extra","پیشنهاد ویژه"],
    ["One more visit?","Noch ein Besuch?","یک بازدید دیگر؟"],
    ["A little challenge now. Something lovely on your next visit.","Ein kleines Spiel jetzt, ein Extra beim nächsten Besuch.","الان یک چالش کوتاه؛ بازدید بعدی یک سورپرایز."],
    ["Save my return treat","Belohnung für nächsten Besuch merken","ذخیره پاداش بازگشت"],
    ["A surprise on your next visit","Überraschung beim nächsten Besuch","سورپرایز برای بازدید بعدی"],
    ["Next visit","Nächster Besuch","بازدید بعدی"],
    ["More fun together","Gemeinsam macht's mehr Spaß","با هم جذاب‌تره"],
    ["Send a challenge to a friend and make a new shared memory.","Lade Freunde zu einer Challenge ein.","چالش را برای دوستت بفرست و خاطره مشترک بساز."],
    ["Invite a friend","Freund einladen","دعوت از دوست"],
    ["A special shared moment","Ein schöner gemeinsamer Moment","یک لحظه مشترک خاص"],
    ["Friend challenge","Freunde-Challenge","چالش دوستان"],
    ["Know before you go","Gut vorbereitet","آماده و آگاه"],
    ["Discover the essentials in a friendly, playable moment.","Entdecke Wichtiges spielerisch und einfach.","اطلاعات لازم را با یک بازی کوتاه یاد بگیر."],
    ["What should I know?","Was muss ich wissen?","چه چیزی باید بدانم؟"],
    ["Read the important preparation steps","Wichtige Hinweise lesen","خواندن نکات ضروری"],
    ["Service guide","Servicehinweise","راهنمای خدمات"],
    ["I UNDERSTAND ✓","VERSTANDEN ✓","متوجه شدم ✓"],
    ["CREATE MY CHALLENGE ↗","CHALLENGE ERSTELLEN ↗","ساخت چالش ↗"],
    ["Swipe or use arrows to collect marks and avoid the walls.","Wischen oder Pfeiltasten nutzen: Symbole sammeln, Wände meiden.","انگشتت را بکش یا از کلیدهای جهت استفاده کن؛ علامت‌ها را جمع کن و به دیوار نخور."],
    ["Move the paddle. Break every glowing block.","Schiebe den Schläger und zerstöre alle leuchtenden Blöcke.","راکت را جابه‌جا کن و همه آجرهای درخشان را بشکن."],
    ["Tap to fly through the gates.","Tippen, um durch die Tore zu fliegen.","لمس کن تا از بین دروازه‌ها پرواز کنی."],
    ["Catch the bright objects and dodge the dark ones.","Fange die hellen Objekte und meide die dunklen.","اشیای روشن را بگیر و از اشیای تیره دوری کن."],
    ["Tap flowers before they fade away.","Tippe die Blumen an, bevor sie verblühen.","قبل از محو شدن گل‌ها، روی آن‌ها بزن."],
    ["Switch between three lanes and dodge obstacles.","Wechsle zwischen drei Bahnen und weiche Hindernissen aus.","بین سه مسیر جابه‌جا شو و از موانع جاخالی بده."],
    ["Watch the pattern, then repeat it. Tap quadrants 1 to 4.","Präge dir das Muster ein und wiederhole es. Tippe Felder 1 bis 4.","الگو را به خاطر بسپار و تکرار کن؛ مربع‌های ۱ تا ۴ را لمس کن."],
    ["DEMO ONLY — NO VALID REWARD","NUR DEMO — KEIN ECHTER PREIS","فقط نسخه آزمایشی — بدون پاداش واقعی"],
    ["Preview campaign only. No real reward, offer or discount is issued.","Nur Vorschau. Es wird keine echte Prämie oder Ermäßigung ausgegeben.","این فقط پیش‌نمایش است؛ پاداش یا تخفیف واقعی صادر نمی‌شود."],
    ["Show this code to the business. Staff must verify a real action before counting it.","Zeig diesen Code im Betrieb. Das Personal muss die Aktion bestätigen.","این کد را به کسب‌وکار نشان بده؛ کارکنان باید اقدام واقعی را تأیید کنند."],
    ["Play with me","Spiel mit mir","با من بازی کن"]
  ];
  for (const [source,de,fa] of entries) catalog.set(source.trim(),{de,fa});
  const normalized = new WeakMap();
  const emitted = new WeakMap();
  const attrOriginal = new WeakMap();
  const attrs = ['placeholder','title','aria-label','alt'];
  let selected = 'de';
  try {
    const urlLocale=new URLSearchParams(location.search).get('lang');
    const saved=localStorage.getItem('pwyw.locale');
    selected = (urlLocale==='fa'||urlLocale==='de')?urlLocale:((saved==='fa'||saved==='de')?saved:'de');
  } catch {}
  function t(value,locale=selected) {
    const text=String(value??'');
    const trimmed=text.trim();
    const entry=catalog.get(trimmed);
    if(entry) return text.replace(trimmed,entry[locale]);
    const rules=[
      [/^BUILD PLAY TO (UPSELL|RETURN|REFER|LEARN)$/,(m,g)=>locale==='fa'?'ساخت کمپین '+({UPSELL:'فروش مکمل',RETURN:'بازگشت',REFER:'معرفی',LEARN:'یادگیری'})[g]:'KAMPAGNE: '+({UPSELL:'MEHR VERKAUFEN',RETURN:'WIEDERKEHR',REFER:'EMPFEHLEN',LEARN:'LERNEN'})[g]],
      [/^PLAY TO (UPSELL|RETURN|REFER|LEARN)(.*)$/,(m,g,s)=> (locale==='fa'?({UPSELL:'فروش مکمل',RETURN:'بازگشت',REFER:'معرفی',LEARN:'یادگیری'})[g]:({UPSELL:'MEHR VERKAUFEN',RETURN:'WIEDERKEHR',REFER:'EMPFEHLEN',LEARN:'LERNEN'})[g])+s],
      [/^YOUR MOMENT \/ (UPSELL|RETURN|REFER|LEARN)$/,(m,g)=>locale==='fa'?'لحظه تو / '+({UPSELL:'فروش مکمل',RETURN:'بازگشت',REFER:'معرفی',LEARN:'یادگیری'})[g]:'DEIN MOMENT / '+g],
      [/^([0-9]+) redeemed$/,(m,n)=>locale==='fa'?n+' استفاده‌شده':n+' eingelöst'],
      [/^([0-9]+) pts$/i,(m,n)=>locale==='fa'?n+' امتیاز':n+' Punkte'],
      [/^([0-9]+) PTS$/,(m,n)=>locale==='fa'?n+' امتیاز':n+' PUNKTE'],
      [/^Hidden card ([0-9]+)$/,(m,n)=>locale==='fa'?'کارت پنهان '+n:'Verdeckte Karte '+n],
      [/^Card (.+)$/,(m,n)=>locale==='fa'?'کارت '+n:'Karte '+n],
      [/^([0-9]+) issued · ([0-9]+) CTA clicks · (.+) € declared net contribution$/,(m,a,b,v)=>locale==='fa'?a+' کد صادرشده · '+b+' کلیک · '+v+' یورو مبلغ خالص اعلام‌شده':a+' Codes · '+b+' Klicks · '+v+' € deklarierter Nettobeitrag'],
      [/^SCENE: (ACTIVE|GENERATED) · OBJECT: (ACTIVE|GENERATED)$/,(m,a,b)=>locale==='fa'?'صحنه: '+(a==='ACTIVE'?'فعال':'تولیدشده')+' · شیء: '+(b==='ACTIVE'?'فعال':'تولیدشده'):'SZENE: '+(a==='ACTIVE'?'AKTIV':'GENERIERT')+' · OBJEKT: '+(b==='ACTIVE'?'AKTIV':'GENERIERT')]
    ];
    for(const [re,fn] of rules){const m=trimmed.match(re);if(m)return text.replace(trimmed,fn(...m))}
    return text;
  }
  function shouldSkip(node) {
    const p=node.parentElement;
    return !p || !!p.closest('script,style,textarea,code,pre,[data-no-i18n],.reward-code,.brand-nav');
  }
  function translateNode(node) {
    if(shouldSkip(node))return;
    let previous=normalized.get(node);
    let last=emitted.get(node);
    if(previous===undefined|| (last!==undefined && node.nodeValue!==last)){
      previous=node.nodeValue;normalized.set(node,previous);
    }
    if(previous===undefined) return;
    const translated=t(previous);
    if(node.nodeValue!==translated){node.nodeValue=translated;}
    emitted.set(node,translated);
  }
  function translateElement(el) {
    if(!el || !el.getAttribute || el.closest('script,style,[data-no-i18n]'))return;
    let origin=attrOriginal.get(el);
    if(!origin){origin={};attrOriginal.set(el,origin)}
    for(const attr of attrs){
      if(!el.hasAttribute(attr))continue;
      const current=el.getAttribute(attr);
      if(origin[attr]===undefined || (origin[attr+'$']!==undefined && current!==origin[attr+'$']))origin[attr]=current;
      const out=t(origin[attr]);if(current!==out)el.setAttribute(attr,out);origin[attr+'$']=out;
    }
    // Append the selected language to game/share URLs so visiting customers see it too.
    if(el.tagName==='A' && el.hasAttribute('href')){
      const href=el.getAttribute('href');
      if(href && href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/static/') && !href.startsWith('/qr/')){
        try {const u=new URL(href,location.origin);if(selected==='fa')u.searchParams.set('lang','fa');else u.searchParams.delete('lang');{const next=u.pathname+u.search+u.hash;if(href!==next)el.setAttribute('href',next);}}catch{}
      }
    }
  }
  function render() {
    document.documentElement.lang=selected;
    document.documentElement.dir=selected==='fa'?'rtl':'ltr';
    document.documentElement.dataset.locale=selected;
    document.querySelectorAll('body *').forEach(translateElement);
    const walk=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
    let node;while((node=walk.nextNode()))translateNode(node);
    const toggle=document.getElementById('pwyw-language-switch');
    if(toggle){
      toggle.querySelectorAll('[data-lang]').forEach(btn=>{
        const current=btn.dataset.lang===selected;btn.setAttribute('aria-pressed',String(current));btn.classList.toggle('is-current',current);
      });
    }
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
  function setLocale(locale) {
    if(locale!=='fa'&&locale!=='de')return;
    selected=locale;
    try {localStorage.setItem('pwyw.locale',locale)}catch {}
    try {const u=new URL(location.href);if(locale==='fa')u.searchParams.set('lang','fa');else u.searchParams.delete('lang');history.replaceState(history.state,'',u.pathname+u.search+u.hash)} catch {}
    render();
  }
  function addSwitch() {
    if(document.getElementById('pwyw-language-switch'))return;
    const holder=document.createElement('div');holder.id='pwyw-language-switch';holder.className='pwyw-locale-switch';
    holder.setAttribute('role','group');holder.setAttribute('aria-label','Sprache / زبان');
    for(const [locale,text] of [['de','DE'],['fa','فا']]){
      const btn=document.createElement('button');btn.type='button';btn.dataset.lang=locale;
      btn.textContent=text;btn.addEventListener('click',()=>setLocale(locale));holder.append(btn);
    }
    const header=document.querySelector('.site-nav,.studio-top,.cr-top,.play-header,.masthead');
    if(header){
      const anchor=header.querySelector('.nav-link,.studio-top-right,.cr-quiet,.play-nav:last-child,.nav-enter');
      if(anchor&&anchor.parentElement===header)header.insertBefore(holder,anchor);else header.append(holder);
    }else document.body.prepend(holder);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    addSwitch();render();
    new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','alt','href']});
    document.addEventListener('pwyw:locale',e=>setLocale(e.detail));
  });
  window.PWYWI18N={locale:()=>selected,t,setLocale};
})();