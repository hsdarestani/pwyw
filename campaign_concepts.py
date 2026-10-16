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
    cat=category(brand)
    sector_fa,sector_de=CONTEXT[cat]
    if objective=="upsell":
        ideas=UPSELL[cat]; item=ideas[index%len(ideas)]
        product_fa,heading_fa,offer_fa,product_de,heading_de,offer_de=item
        # No fake discount. A generated code only records interest, not a promised benefit.
        return {
          "fa":{"title":heading_fa,"description":"یه بازی کوتاه انجام بده و بعد یه پیشنهاد مرتبط ببین.",
                "cta":"دریافت کد پیشنهاد","offer":offer_fa,"product_name":product_fa},
          "de":{"title":heading_de,"description":"Spiel eine kurze Runde und entdecke eine passende Ergänzung.",
                "cta":"Vorschlagscode anfordern","offer":offer_de,"product_name":product_de},
          "owner":{
            "fa":f"هدف این ایده، افزایش ارزش سفارش با پیشنهاد «{product_fa}» است. مشتری بعد از بازی یک کد دریافت می‌کند و می‌تواند درباره این گزینه از کارکنان سؤال کند. قبل از انتشار باید مطمئن شوید چنین محصول یا خدمتی در {sector_fa} شما ارائه می‌شود.",
            "de":f"Ziel: höherer Bestellwert durch „{product_de}“. Nach dem Spiel erhält die Kundschaft einen Code und kann beim Team nachfragen. Bitte bestätige, dass diese Option im {sector_de} tatsächlich angeboten wird."
          },"review_needed":True,"concept_id":f"upsell-{cat}-{index%len(ideas)}"
        }
    if objective=="return":
        variants=[
          ("برای دفعه بعد هم یه بازی داریم","یه بازی کوتاه کن و این کد رو برای مراجعه بعدی نگه دار.","کد مراجعه بعدی","این کد رو موقع مراجعه بعدی نشون بده؛ ارائه هرگونه امتیاز با تأیید مجموعه است.",
           "Ein Spiel fürs nächste Mal","Spiel kurz und hebe deinen Code für den nächsten Besuch auf.","Code für den nächsten Besuch","Zeige den Code beim nächsten Besuch. Ein Vorteil gilt nur nach Bestätigung des Betriebs."),
          ("دوباره سر بزن، دوباره بازی کن","این بازی رو انجام بده و کد مخصوص مراجعه بعدی بگیر.","کد بازگشت","برای برنامه‌ریزی مراجعه بعدی از کارکنان راهنمایی بگیر.",
           "Komm gern wieder","Spiel und erhalte einen Code für deinen nächsten Besuch.","Wiederbesuchscode","Frag beim Team nach deinem nächsten Besuch."),
          ("دیدار بعدی رو فراموش نکن","بازی رو تموم کن و این یادآور رو برای مراجعه بعدی دریافت کن.","یادآور مراجعه بعدی","با این کد، هنگام بازگشت به مجموعه خودت رو معرفی کن.",
           "Bis zum nächsten Besuch","Spiel und erhalte eine Erinnerung für deinen nächsten Besuch.","Besuchserinnerung","Zeige den Code, wenn du das nächste Mal da bist.")
        ];v=variants[index%len(variants)]
        fa,de={"title":v[0],"description":v[1],"product_name":v[2],"offer":v[3],"cta":"دریافت کد"},{"title":v[4],"description":v[5],"product_name":v[6],"offer":v[7],"cta":"Code erhalten"}
        return {"fa":fa,"de":de,"owner":{"fa":"هدف: تشویق مشتری به مراجعه دوباره. بعد از بازی یک کد قابل پیگیری دریافت می‌کند. این کد به‌خودی‌خود تخفیف یا هدیه نیست.","de":"Ziel: Wiederbesuche fördern. Nach dem Spiel erhält die Kundschaft einen nachverfolgbaren Code. Er stellt keinen Rabatt oder Gewinn dar."},"review_needed":False,"concept_id":f"return-{index%len(variants)}"}
    if objective=="refer":
        variants=[
         ("دوستت رو به چالش دعوت کن","این بازی رو برای دوستت بفرست و ببین کدومتون امتیاز بیشتری می‌گیره.","چالش دو نفره","دوستت از همون لینک بازی می‌کنه و می‌تونه رکورد خودش رو ثبت کنه.",
          "Fordere jemanden heraus","Teile das Spiel und vergleicht eure Punkte.","Spielchallenge","Dein Freund oder deine Freundin kann über den Link mitspielen."),
         ("یه رقابت کوتاه با دوستات","یه دقیقه بازی کن؛ بعد لینک رو برای دوستات بفرست.","بازی مشترک","لینک بازی رو کپی کن و برای دوستات بفرست.",
          "Eine Runde mit Freunden","Spiel eine Minute und schick die Challenge weiter.","Freundeschallenge","Teile den Spiellink mit Freunden."),
         ("رکورد کی بالاتره؟","بازی رو تموم کن و دوستت رو هم به رقابت دعوت کن.","رقابت دوستانه","بازی رو برای دوستت بفرست تا رکورد خودش رو امتحان کنه.",
          "Wer holt mehr Punkte?","Spiel und fordere Freunde heraus.","Punkte-Challenge","Teile die Herausforderung nach dem Spielen.")
        ];v=variants[index%len(variants)]
        fa,de={"title":v[0],"description":v[1],"product_name":v[2],"offer":v[3],"cta":"دعوت از دوستان"},{"title":v[4],"description":v[5],"product_name":v[6],"offer":v[7],"cta":"Freunde einladen"}
        return {"fa":fa,"de":de,"owner":{"fa":"هدف: معرفی بازی توسط مشتری به دوستانش. پس از پایان بازی لینک اشتراک‌گذاری نمایش داده می‌شود؛ وعده پاداش یا تخفیف داده نمی‌شود.","de":"Ziel: Weiterempfehlung. Nach dem Spielen erscheint ein teilbarer Link; es wird kein Bonus oder Rabatt versprochen."},"review_needed":False,"concept_id":f"refer-{index%len(variants)}"}
    variants=[
      ("قبل از مراجعه این نکته رو بدون","یک بازی کوتاه و بعد یک سؤال کاربردی درباره گرفتن اطلاعات درست.","راهنمای خدمات","اگر سؤال داری، از کارکنان مجموعه راهنمایی بگیر.","Gut vorbereitet","Ein kurzes Spiel mit einer Frage zu zuverlässigen Informationen.","Serviceinformation","Bei Fragen hilft dir das Team."),
      ("راهنمای کوتاه مشتری","بازی کن و یاد بگیر از کجا اطلاعات دقیق خدمات رو بگیری.","اطلاعات خدمات","برای شرایط و جزئیات، از تیم مجموعه سؤال کن.","Kurz informiert","Spiel und erfahre, wo du verlässliche Informationen erhältst.","Wichtige Hinweise","Frag das Team nach Einzelheiten."),
    ];v=variants[index%len(variants)]
    fa,de={"title":v[0],"description":v[1],"product_name":v[2],"offer":v[3],"cta":"دیدن راهنما"},{"title":v[4],"description":v[5],"product_name":v[6],"offer":v[7],"cta":"Hinweis lesen"}
    return {"fa":fa,"de":de,"owner":{"fa":"هدف: توضیح یک نکته قابل اتکا به مشتری. بعد از بازی یک سؤال کوتاه نمایش داده می‌شود؛ این سؤال درباره راه ارتباط با کارکنان است، نه ادعای تخصصی یا پزشکی.","de":"Ziel: Eine sichere Serviceinformation vermitteln. Nach dem Spiel erscheint eine kurze Frage zum Kontakt mit dem Team."},"review_needed":False,"concept_id":f"learn-{index%len(variants)}"}

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
