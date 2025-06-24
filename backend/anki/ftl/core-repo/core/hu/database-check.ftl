database-check-corrupt = A gyűjtemény sérült. Kérlek, tekintsd meg az útmutatót.
database-check-rebuilt = Adatbázis újraépítve és optimalizálva.
database-check-card-properties =
    { $count ->
        [one] { $count } érvénytelen tulajdonságú kártya javítva.
       *[other] { $count } érvénytelen tulajdonságú kártya javítva.
    }
database-check-missing-templates =
    { $count ->
        [one] { $count } sablon nélküli kártya törölve.
       *[other] { $count } sablon nélküli kártya törölve.
    }
database-check-field-count =
    { $count ->
        [one] Javítottuk a { $count } megjegyzést a rossz mezőszámmal.
       *[other] Javítottuk a { $count } megjegyzéseket a rossz mezőszámmal.
    }
database-check-new-card-high-due =
    { $count ->
        [one] Találtam { $count } új kártyát, amelynek esedékes száma >= 1,000,000 - fontolja meg a kártya újrapozícionálását a BöngészésI képernyőn.
       *[other] Találtam { $count } új kártyákat, amelynek esedékes száma >= 1,000,000 - fontolja meg a kártyák újrapozícionálását a BöngészésI képernyőn.
    }
database-check-card-missing-note =
    { $count ->
        [one] { $count } jegyzet nélküli kártya törölve
       *[other] { $count } jegyzet nélküli kártya törölve
    }
database-check-duplicate-card-ords =
    { $count ->
        [one] Törölt { $count } kártya duplikált sablonnal.
       *[other] Törölt { $count } kártyák duplikált sablonnal.
    }
database-check-missing-decks =
    { $count ->
        [one] Fixed { $count } hiányzó pakli.
       *[other] Fixed { $count } hiányzó paklik.
    }
database-check-revlog-properties =
    { $count ->
        [one] Javítva az érvénytelen tulajdonságokkal rendelkező { $count } áttekintési bejegyzést.
       *[other] Javítva az érvénytelen tulajdonságokkal rendelkező { $count } áttekintési bejegyzések.
    }
database-check-notes-with-invalid-utf8 =
    { $count ->
        [one] Javított { $count } jegyzet érvénytelen utf8 karakterekkel.
       *[other] Javított { $count } jegyzetek érvénytelen utf8 karakterekkel.
    }
database-check-fixed-invalid-ids =
    { $count ->
        [one] Javított { $count } objektum időbélyegekkel a jövőben.
       *[other] Javított { $count } objektumok időbélyegekkel a jövőben.
    }
# "db-check" is always in English
database-check-notetypes-recovered = Egy vagy több jegyzettípus hiányzott. Az ezeket használó jegyzetek új, "db-check" kezdetű jegyzettípusokat kaptak, de a mezőnevek és a kártyakialakítás elveszett, ezért lehet, hogy jobban jár, ha automatikus biztonsági mentésből állítja vissza.

## Progress info

database-check-checking-integrity = Gyűjtemény ellenőrzése...
database-check-rebuilding = Újjáépítés...
database-check-checking-cards = Kártyák ellenőrzése...
database-check-checking-notes = Ellenőrzöm a jegyzeteket...
database-check-checking-history = Előzmények ellenőrzése....
database-check-title = Adatbázis ellenőrzése
