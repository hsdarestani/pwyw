"""Curated, business-specific campaign concepts used if AI fails editorial validation.

Only category-typical suggestions; no presumed inventory, free goods, discounts or guaranteed gains.
Each idea has a reason for the business owner and actual customer-facing German/Persian copy.
"""
from copy import deepcopy

# (fa product, fa hook, fa message, de product, de hook, de message)
UPSELL = {
 "cafe": [
 ("شیرینی کنار قهوه","قهوه‌ات رو با یه شیرینی کامل کن","از شیرینی‌های موجود کنار قهوه بپرس.","Gebäck zum Kaffee","Lust auf etwas Süßes zum Kaffee?","Frag nach dem aktuellen Gebäck."),
 ("دسر کنار نوشیدنی","نوشیدنی با یه دسر خوشمزه‌تر می‌شه","دسرهای موجود رو از کارکنان بپرس.","Dessert zum Getränk","Noch etwas Süßes zum Getränk?","Frag nach den verfügbaren Desserts."),
 ("اسنک کنار نوشیدنی","یه خوراکی سبک کنار نوشیدنی چطوره؟","ببین چه اسنک‌هایی امروز موجوده.","Snack zum Getränk","Ein kleiner Snack dazu?","Frag nach den Snacks von heute."),
 ("چای کنار شیرینی","چای و شیرینی؛ یه ترکیب دل‌چسب","از کارکنان درباره انواع چای و شیرینی بپرس.","Tee und Gebäck","Eine Tasse Tee dazu?","Frag nach Tee und Gebäck."),
 ("صبحانه کنار قهوه","یه شروع خوب برای روز","ببین چه گزینه‌هایی برای صبحانه موجوده.","Frühstück zum Kaffee","Ein Frühstück zum Kaffee?","Frag nach den Frühstücksoptionen."),
 ("نوشیدنی دوم","برای همراهت هم یه نوشیدنی؟","درباره نوشیدنی‌های موجود از کارکنان بپرس.","Getränk für deine Begleitung","Noch ein Getränk für jemanden?","Frag nach der Getränkeauswahl."),
 ],
 "restaurant": [
 ("دسر بعد از غذا","بعد از غذا، یه دسر هم می‌چسبه","از دسرهای موجود امروز بپرس.","Dessert nach dem Essen","Wie wär's mit einem Dessert?","Frag nach den heutigen Desserts."),
 ("نوشیدنی کنار غذا","یه نوشیدنی مناسب کنار غذات","از کارکنان درباره نوشیدنی‌های موجود بپرس.","Getränk zum Essen","Welches Getränk passt dazu?","Frag nach der Getränkeauswahl."),
 ("پیش‌غذا","قبل از غذای اصلی، یه پیش‌غذا؟","ببین چه پیش‌غذاهایی در منو هست.","Vorspeise","Lust auf eine Vorspeise?","Frag nach den verfügbaren Vorspeisen."),
 ("دورچین غذا","کنار غذات یه دورچین هم می‌خوای؟","گزینه‌های دورچین رو از کارکنان بپرس.","Beilage zum Gericht","Noch eine Beilage dazu?","Frag nach den passenden Beilagen."),
 ("چای یا قهوه بعد از غذا","غذا تموم شد؛ یه نوشیدنی گرم؟","درباره چای یا قهوه بعد از غذا بپرس.","Kaffee oder Tee danach","Zum Abschluss Kaffee oder Tee?","Frag nach heißen Getränken."),
 ("سالاد کنار غذا","یه سالاد کنار غذات چطوره؟","سالادهای موجود رو از کارکنان بپرس.","Salat zum Hauptgericht","Ein Salat zum Hauptgericht?","Frag nach der Salatauswahl."),
 ],
 "salon": [
 ("محصول مراقبت مو","مراقبت از مو بعد از سالن هم ادامه داره","برای انتخاب محصول مناسب موی خودت از آرایشگرت راهنمایی بگیر.","Haarpflege für zu Hause","Haarpflege auch nach dem Termin?","Frag nach passenden Pflegeprodukten."),
 ("محصول مراقبت پوست","برای روتین مراقبت پوستت یه پیشنهاد داریم","درباره محصولات موجود متناسب با پوستت بپرس.","Hautpflege für zu Hause","Die Pflegeroutine zu Hause ergänzen?","Frag nach passenden Produkten."),
 ("سرویس تکمیلی مو","برای موهات خدمات دیگه‌ای هم هست؟","از آرایشگر درباره خدمات مکمل قابل رزرو بپرس.","Ergänzender Haarservice","Noch ein passender Haarservice?","Frag nach zusätzlichen buchbaren Leistungen."),
 ("محصول حالت‌دهنده مو","حالت موهات رو توی خونه هم حفظ کن","برای انتخاب محصول حالت‌دهنده مناسب بپرس.","Stylingprodukt","Styling auch zu Hause?","Frag nach den verfügbaren Stylingprodukten."),
 ("مراقبت ناخن","به فکر مراقبت از ناخن‌هات هم باش","درباره گزینه‌های مراقبت ناخن بپرس.","Nagelpflege","Auch an die Nägel gedacht?","Frag nach verfügbaren Nagelpflegeangeboten."),
 ("مشاوره خدمات بعدی","برای مراجعه بعدی چه خدماتی مناسبه؟","از تیم سالن درباره خدمات قابل رزرو راهنمایی بگیر.","Beratung für den nächsten Termin","Was passt zum nächsten Termin?","Frag nach buchbaren Leistungen."),
 ],
 "auto": [
 ("بررسی تایر","به وضعیت تایرها هم توجه کن","درباره خدمات بررسی تایر از تعمیرگاه بپرس.","Reifencheck","Reifen schon geprüft?","Frag nach einer Reifenprüfung."),
 ("بررسی چراغ‌ها","چراغ‌های خودرو هم مهم‌اند","ببین خدمات بررسی چراغ‌ها ارائه می‌شه یا نه.","Lichtcheck","Beleuchtung prüfen lassen?","Frag nach einem Lichtcheck."),
 ("نظافت خودرو","بعد از سرویس، نظافت خودرو چطوره؟","از خدمات نظافت موجود بپرس.","Fahrzeugreinigung","Nach dem Service eine Reinigung?","Frag nach der Fahrzeugreinigung."),
 ("بررسی برف‌پاک‌کن","برف‌پاک‌کن‌ها رو هم بررسی کردی؟","درباره امکان بررسی برف‌پاک‌کن بپرس.","Wischerprüfung","Scheibenwischer im Blick?","Frag nach einer Wischerprüfung."),
 ("بررسی مایع شیشه‌شوی","دید بهتر با مراقبت ساده‌تر","از کارکنان درباره بررسی شیشه‌شوی بپرس.","Scheibenwaschwasser","Ist die Scheibenwaschanlage bereit?","Frag nach einer Prüfung."),
 ("مشاوره سرویس بعدی","نوبت سرویس بعدی رو فراموش نکن","برای بررسی زمان مناسب سرویس از تیم تعمیرگاه بپرس.","Nächster Service","An den nächsten Werkstatttermin gedacht?","Frag nach der Serviceplanung."),
 ],
 "hotel": [
 ("صبحانه هتل","برای فردا صبحانه در نظر گرفتی؟","از پذیرش درباره گزینه‌های صبحانه بپرس.","Hotelfrühstück","Schon an morgen früh gedacht?","Frag nach den Frühstücksangeboten."),
 ("خدمات اتاق","برای اقامت راحت‌تر چه امکاناتی هست؟","از پذیرش درباره خدمات اتاق بپرس.","Zimmerservice","Noch etwas fürs Zimmer?","Frag nach dem Zimmerservice."),
 ("رستوران یا کافه","برای غذا یا نوشیدنی برنامه داری؟","از پذیرش درباره گزینه‌های موجود بپرس.","Restaurant oder Café","Schon etwas zum Essen geplant?","Frag nach gastronomischen Angeboten."),
 ("پارکینگ","برای خودروت جای پارک می‌خوای؟","امکان پارکینگ رو از پذیرش بپرس.","Parkplatz","Braucht dein Auto einen Platz?","Frag nach Parkmöglichkeiten."),
 ("خدمات حمل‌ونقل","برای مسیر بعدی کمکی نیاز داری؟","درباره خدمات جابه‌جایی یا تاکسی بپرس.","Transferangebot","Die nächste Fahrt schon geplant?","Frag nach Transportmöglichkeiten."),
 ("راهنمای تفریح محلی","اطراف هتل کجاها رو ببینیم؟","از پذیرش درباره پیشنهادهای گردش اطراف بپرس.","Ausflugstipps","Noch etwas vor in der Stadt?","Frag nach Ausflugsmöglichkeiten."),
 ],
 "health": [
 ("راهنمای خدمات قابل رزرو","کدوم خدمات این مجموعه برای تو مناسبه؟","قبل از انتخاب، درباره خدمات موجود از تیم مجموعه راهنمایی بگیر.","Beratung zu Leistungen","Welche Leistung passt zu dir?","Frag das Team nach verfügbaren Leistungen."),
 ("مشاوره پیش از رزرو","قبل از رزرو، سؤال‌هات رو بپرس","درباره شرایط و گزینه‌های موجود با تیم مجموعه صحبت کن.","Beratung vor der Buchung","Noch Fragen vor der Buchung?","Lass dich zu verfügbaren Angeboten beraten."),
 ("خدمات مراقبت عمومی","درباره خدمات مراقبتی بیشتر بدون","برای اطلاع از خدمات قابل ارائه از کارکنان بپرس.","Allgemeine Pflegeangebote","Mehr über Pflegeangebote erfahren?","Frag nach den verfügbaren Angeboten."),
 ("برنامه مراجعه بعدی","برای مراجعه بعدی برنامه داری؟","نحوه رزرو و شرایط مراجعه بعدی رو بپرس.","Nächster Termin","Schon an den nächsten Termin gedacht?","Frag nach Terminmöglichkeiten."),
 ],
 "other": [
 ("محصول مرتبط با خرید","می‌خوای چیز مناسبی هم کنار خریدت انتخاب کنی؟","از فروشنده درباره محصولات مکمل موجود بپرس.","Passender Zusatzartikel","Darf's etwas Passendes dazu sein?","Frag nach verfügbaren Ergänzungen."),
 ("خدمات تکمیلی","این خرید، خدمات تکمیلی هم داره؟","از تیم فروش درباره خدمات جانبی موجود بپرس.","Ergänzende Leistung","Gibt es eine passende Zusatzleistung?","Frag nach ergänzenden Services."),
 ("لوازم کاربردی مرتبط","یه وسیله کاربردی کنار خریدت","از فروشنده بپرس چه لوازم مرتبطی موجوده.","Passendes Zubehör","Schon ans passende Zubehör gedacht?","Frag nach verfügbarem Zubehör."),
 ("بسته‌های ترکیبی","خرید ترکیبی برات مناسب‌تره؟","درباره بسته‌ها یا گزینه‌های ترکیبی موجود بپرس.","Kombi-Angebote","Passt eine Kombination besser?","Frag nach verfügbaren Kombinationen."),
 ],
}
CONTEXT={
 "cafe":("کافه","Café"),"restaurant":("رستوران","Restaurant"),"salon":("سالن","Studio"),
 "auto":("تعمیرگاه","Werkstatt"),"hotel":("هتل","Hotel"),"health":("مجموعه خدماتی","Einrichtung"),
 "other":("کسب‌وکار","Unternehmen")
}
def category(brand):
    raw=str(brand.get("industry") or "other").strip().lower()
    return raw if raw in UPSELL else "other"

def concept(brand,objective,index):
    """Plan around the actual game mechanic, not generic marketing slogans.

    Approving a proposal is the merchant's explicit decision to show the item.
    Never invent an amount, price cut, loyalty reward or automatic checkout.
    """
    cat=category(brand)
    if objective=="upsell":
        ideas=UPSELL[cat]
        product_fa,title_fa,_,product_de,title_de,_=ideas[index%len(ideas)]
        return {
          "fa":{
             "title":title_fa,
             "description":"یه دست بازی کن و بعد ببین چی می‌تونی به سفارشت اضافه کنی.",
             "cta":"دریافت کد پیگیری",
             "offer":f"«{product_fa}» رو هم می‌خوای؟ کدت رو موقع سفارش به کارکنان نشون بده.",
             "product_name":product_fa
          },
          "de":{
             "title":title_de,
             "description":"Spiel eine kurze Runde und entdecke eine Ergänzung zu deiner Bestellung.",
             "cta":"Code für die Bestellung",
             "offer":f"Du möchtest auch „{product_de}“ bestellen? Zeig deinen Code bei der Bestellung.",
             "product_name":product_de
          },
          "owner":{
             "fa":f"محصول پیشنهادی: «{product_fa}». مشتری بعد از بازی این گزینه رو می‌بینه و در صورت تمایل، کدش رو موقع سفارش نشون می‌ده. شما فقط خریدهای انجام‌شده رو در پنل تأیید می‌کنی.",
             "de":f"Empfohlen wird „{product_de}“. Nach dem Spiel können Gäste einen Code bei der Bestellung vorzeigen. Im Studio bestätigst du nur tatsächlich erfolgte Käufe."
          },
          "review_needed":True,
          "concept_id":f"upsell-{cat}-{index%len(ideas)}"
        }
    if objective=="return":
        variants=[
          ("یه دلیل برای دوباره سر زدن","یه دست بازی کن و کد مراجعه بعدی رو نگه دار.",
           "کد مراجعه بعدی","کد رو برای دفعه بعد نگه دار و موقع مراجعه نشون بده.",
           "Ein Grund wiederzukommen","Spiel kurz und hebe deinen Code für den nächsten Besuch auf.",
           "Code für deinen nächsten Besuch","Heb den Code auf und zeig ihn bei deinem nächsten Besuch."),
          ("تا دیدار بعدی!","بازی رو تموم کن و یک یادآور برای مراجعه بعدی بگیر.",
           "یادآور بازگشت","هر وقت دوباره سر زدی، این کد رو همراهت داشته باش.",
           "Bis zum nächsten Mal!","Spiel und nimm einen Code für deinen nächsten Besuch mit.",
           "Erinnerung für den nächsten Besuch","Zeig den Code, wenn du wieder vorbeikommst."),
          ("یه بازی کوتاه تا دفعه بعد","وقت بازیه! در پایان، کد مخصوص مراجعه بعدی رو دریافت می‌کنی.",
           "کد بازگشت","اگه دوباره اومدی، کد رو به کارکنان نشون بده.",
           "Ein Spiel bis zum Wiedersehen","Spiele kurz und erhalte einen Code für deinen nächsten Besuch.",
           "Wiederbesuchscode","Zeig den Code bei deinem nächsten Besuch.")
        ]
        v=variants[index%len(variants)]
        return {
          "fa":{"title":v[0],"description":v[1],"product_name":v[2],"offer":v[3],"cta":"دریافت کد بازگشت"},
          "de":{"title":v[4],"description":v[5],"product_name":v[6],"offer":v[7],"cta":"Wiederbesuchscode erhalten"},
          "owner":{
            "fa":"هدف: تشویق مشتری به برگشتن. بعد از بازی یک کد مخصوص دریافت می‌کنه؛ وقتی دوباره مراجعه کرد، کارکنان کد رو ثبت می‌کنن تا تعداد بازگشت‌های واقعی مشخص بشه. این کد تخفیف نیست.",
            "de":"Ziel: Wiederbesuche anregen. Nach dem Spiel erhält die Kundschaft einen Code. Bei der Rückkehr erfasst das Team den Code, damit echte Wiederbesuche gezählt werden. Der Code ist kein Rabatt."
          },"review_needed":False,"concept_id":f"return-{index%len(variants)}"
        }
    if objective=="refer":
        variants=[
         ("دوستت رو به بازی دعوت کن","یک دست بازی کن و بعد لینک چالش رو برای دوستت بفرست.",
          "چالش با دوستان","لینک رو برای دوستت بفرست تا اون هم بازی کنه.",
          "Freunde zum Spielen einladen","Spiel eine Runde und teile anschließend den Link.",
          "Challenge mit Freunden","Sende den Spiellink an Freunde."),
         ("این بازی رو دوتایی امتحان کنین","بازی کن و بعد دوستت رو هم به رقابت دعوت کن.",
          "بازی مشترک","لینک رو به اشتراک بذار؛ هر دو می‌تونین بازی کنین.",
          "Spielt doch zu zweit","Spiel eine Runde und fordere danach Freunde heraus.",
          "Gemeinsame Challenge","Teile den Link, damit deine Freunde mitspielen können."),
         ("کی امتیاز بیشتری می‌گیره؟","رکوردت رو ثبت کن و بازی رو برای دوستت بفرست.",
          "رقابت دوستانه","لینک بازی رو برای دوستت بفرست تا اون هم امتحان کنه.",
          "Wer holt mehr Punkte?","Spiel und schick die Herausforderung an Freunde.",
          "Freundschaftlicher Wettbewerb","Teile den Spiellink für die nächste Runde.")
        ]
        v=variants[index%len(variants)]
        return {
         "fa":{"title":v[0],"description":v[1],"product_name":v[2],"offer":v[3],"cta":"دعوت از دوست"},
         "de":{"title":v[4],"description":v[5],"product_name":v[6],"offer":v[7],"cta":"Freunde einladen"},
         "owner":{
           "fa":"هدف: مشتری بازی رو برای دوستش می‌فرسته. بعد از بازی دکمهٔ اشتراک‌گذاری ظاهر می‌شه تا افراد جدید هم وارد صفحهٔ شما بشن. صرفِ ارسال لینک به معنی جذب مشتری جدید یا فروش نیست.",
           "de":"Ziel: Mehr Menschen entdecken dein Geschäft über geteilte Spiellinks. Nach dem Spiel kann der Link weitergegeben werden. Ein geteilter Link ist noch kein neuer Kauf."
         },"review_needed":False,"concept_id":f"refer-{index%len(variants)}"
        }
    variants=[
       ("از کجا اطلاعات دقیق بگیریم؟","یه بازی کوتاه، بعدش یک سؤال درباره راه درست دریافت اطلاعات.",
        "راهنمای خدمات","برای اطلاع دقیق درباره خدمات، مستقیم از تیم مجموعه بپرس.",
        "Wo bekommst du verlässliche Infos?","Ein kurzes Spiel und danach eine Frage zur richtigen Informationsquelle.",
        "Serviceinformationen","Für genaue Informationen hilft dir das Team weiter."),
       ("یه نکته قبل از مراجعه","بعد از بازی یک سؤال کوتاه می‌بینی که کمک می‌کنه راه درست رو بشناسی.",
        "راهنمای مراجعه","اگه درباره شرایط مراجعه سؤالی داری، از کارکنان بپرس.",
        "Ein Hinweis vor dem Besuch","Nach dem Spiel folgt eine kurze Frage für deinen Besuch.",
        "Hinweise zum Besuch","Bei Fragen zum Besuch hilft dir das Team.")
    ]
    v=variants[index%len(variants)]
    return {
       "fa":{"title":v[0],"description":v[1],"product_name":v[2],"offer":v[3],"cta":"شروع سؤال"},
       "de":{"title":v[4],"description":v[5],"product_name":v[6],"offer":v[7],"cta":"Frage starten"},
       "owner":{
         "fa":"هدف: مشتری بعد از بازی به یک سؤال کوتاه پاسخ می‌ده و با راه دریافت اطلاعات معتبر آشنا می‌شه. تعداد پاسخ‌ها قابل اندازه‌گیریه؛ کاهش زمان کار کارکنان صرفاً از این عدد ثابت نمی‌شه.",
         "de":"Ziel: Nach dem Spiel beantwortet die Kundschaft eine kurze Frage und erfährt, wo es verlässliche Informationen gibt. Antworten lassen sich messen, eine Zeitersparnis wird damit nicht automatisch belegt."
       },"review_needed":False,"concept_id":f"learn-{index%len(variants)}"
    }

def as_campaign(brand,objective,index,games,quiz_de=None,quiz_fa=None):
    idea=concept(brand,objective,index)
    p={
       "objective":objective,"title":idea["de"]["title"],"description":idea["de"]["description"],
       "cta":idea["de"]["cta"],"offer":idea["de"]["offer"],"product_name":idea["de"]["product_name"],
       "game":games[objective][index%len(games[objective])],
       "destination":"","margin_per_sale":0,"reward_cost":0,"is_active":True,
       "translations":{"fa":deepcopy(idea["fa"])},
       "owner_explanation":idea["owner"],"review_needed":idea["review_needed"],
       "concept_id":idea["concept_id"]
    }
    if objective=="learn":
       p.update(quiz_de or {})
       p["quiz_correct_index"]=0
       p["translations"]["fa"].update(quiz_fa or {})
    return p
