# The date a card will be ready to review
statistics-due-date = Vade
# The count of cards waiting to be reviewed
statistics-due-count = Vade
# Shown in the Due column of the Browse screen when the card is a new card
statistics-due-for-new-card = Yeni #{ $number }

## eg 16.8s (3.6 cards/minute)

statistics-cards-per-min = { $cards-per-minute } kart/dakika
statistics-average-answer-time = { $average-seconds }sn ({ statistics-cards-per-min })

## A span of time studying took place in, for example
## "(studied 30 cards) in 3 minutes"

statistics-in-time-span-seconds =
    { $amount ->
        [one] { $amount } saniye içinde
       *[other] { $amount } saniye içinde
    }
statistics-in-time-span-minutes =
    { $amount ->
        [one] { $amount } dakika içinde
       *[other] { $amount } dakika içinde
    }
statistics-in-time-span-hours =
    { $amount ->
        [one] { $amount } saat içinde
       *[other] { $amount } saat içinde
    }
statistics-in-time-span-days =
    { $amount ->
        [one] { $amount } gün içinde
       *[other] { $amount } gün içinde
    }
statistics-in-time-span-months =
    { $amount ->
        [one] { $amount } ay içinde
       *[other] { $amount } ay içinde
    }
statistics-in-time-span-years =
    { $amount ->
        [one] { $amount } yıl içinde
       *[other] { $amount } yıl içinde
    }
statistics-cards =
    { $cards ->
        [one] { $cards } kart
       *[other] { $cards } kart
    }
statistics-notes =
    { $notes ->
        [one] { $notes } not
       *[other] { $notes } not
    }
# a count of how many cards have been answered, eg "Total: 34 reviews"
statistics-reviews =
    { $reviews ->
        [one] { $reviews } gözden geçirme
       *[other] { $reviews } gözden geçirme
    }
# Shown at the bottom of the deck list, and in the statistics screen.
# eg "Studied 3 cards in 13 seconds today (4.33s/card)."
# The { statistics-in-time-span-seconds } part should be pasted in from the English
# version unmodified.
statistics-studied-today =
    { $unit ->
        [seconds]
            { statistics-cards }
            bugün { statistics-in-time-span-seconds } çalışıldı
            ({ $secs-per-card }sn/kart)
        [minutes]
            { statistics-cards }
            bugün { statistics-in-time-span-minutes } çalışıldı
            ({ $secs-per-card }dk/kart)
        [hours]
            { statistics-cards }
            bugün { statistics-in-time-span-hours } çalışıldı
            ({ $secs-per-card }sa/kart)
        [days]
            { statistics-cards }
            bugün { statistics-in-time-span-days } çalışıldı
            ({ $secs-per-card }g/kart)
        [months]
            { statistics-cards }
            bugün { statistics-in-time-span-months } çalışıldı
            ({ $secs-per-card }ay/kart)
       *[years]
            { statistics-cards }
            bugün { statistics-in-time-span-years } çalışıldı
            ({ $secs-per-card }y/kart)
    }
statistics-today-title = Bugün
statistics-today-again-count = Tekrar sayısı:
statistics-today-type-counts = Öğrenme: { $learnCount }, Gözden Geçirme: { $reviewCount }, Yeniden Öğrenme: { $relearnCount }, Filtrelenmiş: { $filteredCount }
statistics-today-no-cards = Bugün hiçbir kart çalışılmadı.
statistics-today-no-mature-cards = Bugün çalışılan olgun kart yok.
statistics-today-correct-mature = Olgun kartlardaki doğru cevaplar: { $correct }/{ $total } (%{ $percent })
statistics-counts-total-cards = Toplam
statistics-counts-new-cards = Yeni
statistics-counts-young-cards = Genç
statistics-counts-mature-cards = Olgun
statistics-counts-suspended-cards = Askıya Alındı
statistics-counts-buried-cards = Gizlendi
statistics-counts-filtered-cards = Filtrelenmiş
statistics-counts-learning-cards = Öğrenme
statistics-counts-relearning-cards = Yeniden öğrenme
statistics-counts-title = Kart Sayıları
statistics-counts-separate-suspended-buried-cards = Askıya alınan/Gizlenen kartları ayır
statistics-true-retention-today = Bugün
statistics-true-retention-yesterday = Dün
statistics-true-retention-week = Geçen hafta
statistics-true-retention-month = Geçen ay
statistics-true-retention-year = Geçen yıl
statistics-range-1-year-history = geçen 12 ay
statistics-range-deck = deste
statistics-range-collection = koleksiyon
statistics-range-search = Ara
statistics-card-ease-title = Kart kolaylığı
statistics-card-difficulty-title = Kart Zorluğu
statistics-card-stability-title = Kart sabitliği
statistics-card-stability-subtitle = Hatırlanabilirliğin %90'a düştüğü gecikme.
statistics-average-stability = Ortalama sabitlik
statistics-card-retrievability-title = Kart Hatırlanabilirliği
statistics-card-ease-subtitle = Daha alçak kolaylıktaki kartlar daha sık görünecek.
statistics-card-difficulty-subtitle2 = Zorluk daha yüksek olduğunda sabitlik daha yavaş artacak.
# eg "3 cards with 150-170% ease"
statistics-card-ease-tooltip =
    { $cards ->
        [one] Yüzde { $percent } kolaylıkla { $cards } kart var
       *[other] Yüzde { $percent } kolaylıkla { $cards } kart var
    }
statistics-card-difficulty-tooltip =
    { $cards ->
        [one] Yüzde { $percent } zorlukla { $cards } kart var
       *[other] Yüzde { $percent } zorlukla { $cards } kart var
    }
statistics-retrievability-tooltip =
    { $cards ->
        [one] Yüzde { $percent } hatırlanabilirlikle { $cards } kart var
       *[other] Yüzde { $percent } hatırlanabilirlikle { $cards } kart var
    }
statistics-future-due-title = Tahmin
statistics-future-due-subtitle = Gelecekte yapılacak incelemelerin sayısı.
statistics-added-title = Eklendi
statistics-added-subtitle = Eklediğiniz yeni kartların sayısı.
statistics-reviews-count-subtitle = Cevapladığınız soruların sayısı.
statistics-reviews-time-subtitle = Soruları cevaplamak için harcanan süre.
statistics-answer-buttons-title = Cevap Düğmeleri
# eg Button: 4
statistics-answer-buttons-button-number = Düğme
# eg Times pressed: 123
statistics-answer-buttons-button-pressed = Kez basıldı
statistics-answer-buttons-subtitle = Her düğmeye bastığınız sayı.
statistics-reviews-title = Gözden Geçirmeler
statistics-reviews-time-checkbox = Zaman
statistics-in-days-single =
    { $days ->
        [1] Yarın
        [0] Bugün
       *[other] In { $days } days
    }
statistics-in-days-range = { $daysStart } ila { $daysEnd } gün içinde
statistics-days-ago-single =
    { $days ->
        [1] Dün
       *[other] { $days } days ago
    }
statistics-days-ago-range = { $daysStart } ila { $daysEnd } gün önce
statistics-running-total = Kümülatif toplam
statistics-cards-due =
    { $cards ->
        [one] Sırası gelecek { $cards } kart
       *[other] Sırası gelecek { $cards } kart
    }
statistics-backlog-checkbox = Birikmiş kart
statistics-intervals-title = Gözden Geçirme Aralıkları
statistics-intervals-subtitle = Gözden geçirmeler tekrar gösterilene kadar gecikmeler.
statistics-intervals-day-range =
    { $cards ->
        [one] { $daysStart }~{ $daysEnd } günlük aralıklı { $cards } kart
       *[other] { $daysStart }~{ $daysEnd } günlük aralıklı { $cards } kart
    }
statistics-intervals-day-single =
    { $cards ->
        [one] { $day } günlük aralıklı { $cards } kart
       *[other] { $day } günlük aralıklı { $cards } kart
    }
statistics-stability-day-range =
    { $cards ->
        [one] { $daysStart }~{ $daysEnd } günlük sabitlikli { $cards } kart
       *[other] { $daysStart }~{ $daysEnd } günlük sabitlikli { $cards } kart
    }
statistics-stability-day-single =
    { $cards ->
        [one] { $day } günlük sabitlikli { $cards } kart
       *[other] { $day } günlük sabitlikli { $cards } kart
    }
# hour range, eg "From 14:00-15:00"
statistics-hours-range = { $hourStart }:00 ile { $hourEnd }:00 arası
statistics-hours-correct = { $correct }/{ $total } doğruydu (%{ $percent })
# the emoji depicts the graph displaying this number
statistics-hours-reviews = 📊 { $reviews } gözden geçirme
# the emoji depicts the graph displaying this number
statistics-hours-correct-reviews = 📈 %{ $percent } doğruydu ({ $reviews })
statistics-hours-title = Saatlik Analiz
statistics-hours-subtitle = Günün her saati için başarı oranını inceleyin.
# shown when graph is empty
statistics-no-data = VERİ YOK
statistics-calendar-title = Takvim

## An amount of elapsed time, used in the graphs to show the amount of
## time spent studying. For example, English would show "5s" for 5 seconds,
## "13.5m" for 13.5 minutes, and so on.
##
## Please try to keep the text short, as longer text may get cut off.

statistics-elapsed-time-seconds = { $amount }sn
statistics-elapsed-time-minutes = { $amount }dk
statistics-elapsed-time-hours = { $amount }sa
statistics-elapsed-time-days = { $amount }g
statistics-elapsed-time-months = { $amount }ay
statistics-elapsed-time-years = { $amount }y

##

statistics-average-for-days-studied = Ortalama çalışılan gün
statistics-total = Toplam
statistics-days-studied = Çalışılan günler
statistics-average-answer-time-label = Ortalama cevap süresi
statistics-average = Ortalama
statistics-average-interval = Ortalama aralık
statistics-due-tomorrow = Yarına kadar
statistics-daily-load = Günlük yük
# eg 5 of 15 (33.3%)
statistics-amount-of-total-with-percentage = { $total } içinden { $amount } tanesi (%{ $percent })
statistics-average-over-period = Eğer her gün çalıştıysanız
statistics-reviews-per-day =
    { $count ->
        [one] { $count } gözden geçirme/gün
       *[other] { $count } gözden geçirme/gün
    }
statistics-minutes-per-day =
    { $count ->
        [one] { $count } dakika/gün
       *[other] { $count } dakika/gün
    }
statistics-cards-per-day =
    { $count ->
        [one] { $count } kart/gün
       *[other] { $count } kart/gün
    }
statistics-average-ease = Ortalama kolaylık
statistics-average-difficulty = Ortalama zorluk
statistics-average-retrievability = Ortalama hatırlanabilirlik
statistics-save-pdf = PDF Kaydet
statistics-saved = Kaydedildi.
statistics-stats = İstatistikler
statistics-title = İstatistikler
statistics-true-retention-total = Toplam
statistics-true-retention-young = Genç
statistics-true-retention-mature = Olgun
