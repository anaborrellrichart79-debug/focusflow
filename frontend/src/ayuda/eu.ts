import type { TextosAyuda } from './tipos';

// es.ts-ren itzulpena (erreferentziako bertsioa).
export const eu: TextosAyuda = {
  temas: {
    primerosPasos: {
      titulo: 'Lehen urratsak',
      resumen: 'FocusFlow-k leku bakarrean biltzen ditu zure zereginak, zure agenda eta zure kontzentrazio-denbora.',
      pasos: [
        'Kontua sortzean, laguntzaile batek galdetzen dizu zertarako erabiliko duzun (ikasteko, lanerako, familia antolatzeko) eta Hasiera horretara egokitzen da. Nahi duzunean alda dezakezu Ezarpenak atalean.',
        'Burura etortzen zaizun edozer idatzi beheko barran, «Zer duzu buruan?», eta sakatu Sartu: egiteko zeregin gisa gordetzen da. Gero antolatuko duzu.',
        'Sakatu Ctrl + K (edo lupa) edozein zeregin, ohar edo helburu bilatzeko edozein pantailatatik.',
        'Menuaren goiko hautatzaileak (Dena, Pertsonala, Eskolakoa, Noizbehinkakoa) eremu bakarra ikusten uzten du, institutua gainerakoarekin ez nahasteko.',
        'Hasieran duzu eguneko garrantzitsuena: lehentasunak, hurrengo 7 egunetan amaitzen dena, zure klaseak eta zure pomodoroak.',
      ],
      consejo: 'Pantaila bakoitzean, behean eskuinean dagoen «?» botoiak pantaila horren laguntza irekitzen du.',
    },
    tareas: {
      titulo: 'Zure zereginak antolatu',
      resumen: 'Zeregin berak ikusteko hainbat modu: aukeratu une bakoitzean hobekien datorkizuna.',
      pasos: [
        'Kanban: zutabe bakoitza egoera bat da (Egiteko, Egiten, Kontrolpean, Atzeratua, Eginda eta Artxibatua). Arrastatu txartelak zutabe batetik bestera edo erabili ← → geziak.',
        'Eisenhower matrizea: markatu zeregin bakoitza Presazkoa, Garrantzitsua edo biak bezala, eta bere kabuz kokatzen da Egin orain, Planifikatu, Delegatu edo Ezabatu atalean.',
        '★ izarrak inpaktu handiko zeregin gisa markatzen du (emaitzaren % 80 ematen duen % 20a, Paretoren printzipioa).',
        'Sakatu zeregin bat bere fitxa irekitzeko: muga-data eta ordua, oharrak, errepikatzen den, kalkulatutako denbora, etiketak eta azpizereginak.',
        'Helburuak atalak helburu handiago bateko zereginak biltzen ditu; Oharrak eta To-Do atalak oharrak eta zerrenda laburrak gordetzen ditu; Etiketak atalak gehienez 3 mailako kategorietan antolatzen ditu.',
      ],
    },
    agenda: {
      titulo: 'Agenda',
      resumen: 'Datadun zereginak eta zure klaseak, egun, aste edo hilabeteko ikuspegian.',
      pasos: [
        'Aldatu ikuspegia Eguna, Astea eta Hilabetea botoiekin, eta mugitu geziekin edo itzuli Gaur-era.',
        'Muga-datadun zereginak, etxeko lanak eta ikasketa-saioak agertzen dira, eta, eskola moduarekin, zure ordutegiko klaseak beren kolorearekin.',
        'Google Calendar konektatzen baduzu Ezarpenak atalean, zure gertaerak eta zereginak bi norabideetan sinkronizatzen dira.',
      ],
    },
    horario: {
      titulo: 'Eskola-ordutegia',
      resumen: 'Zure asteko ordutegia; gero Agendak, etxeko lanek eta oporretako abisuek erabiltzen dute.',
      pasos: [
        'Aktibatzeko, markatu eskola modua Ezarpenak atalean eta sortu ordutegia zure ikasturtea eta autonomia-erkidegoa aukeratuta: irakasgai ofizialak kargatuta datoz.',
        'Bete eskuz Editatu botoiarekin, edo Plus planarekin atera argazki bat paperezko ordutegiari eta AAk sarera pasatzen du.',
        'AAk irakurritakoa gorde aurretik berrikusten duzu; gero edozein gelaxka zuzen dezakezu.',
      ],
      consejo: 'AAk laburdurak ulertzen ditu («Mates», «Geo i Hist») eta irakasgai ofizial bihurtzen ditu. Zerbait irakasgaia ez bada (adibidez, tutoretza), hutsik uzten du asmatu beharrean.',
    },
    planificador: {
      titulo: 'Azterketak, lanak eta etxeko lanak',
      resumen: 'Entregatu edo ikasi behar duzun guztia, dataren arabera ordenatuta eta bere irakasgaiarekin.',
      pasos: [
        'Azterketak eta lanak atalean, gehitu entrega bakoitza bere datarekin, motarekin (azterketa, lana edo aurkezpena) eta irakasgaiarekin.',
        'Etxeko lanak atalean, idatzi egun bakoitzekoak: noizko diren esaten ez baduzu, irakasgai horren hurrengo klaserako jartzen dira, asteburuak eta jaiegunak saltatuta.',
        'Plus planarekin, atera argazki bat azterketa-egutegiari (eskuz idatzita egon arren) edo agendako orriari eta AAk dena ateratzen du. Zerrenda berrikusi, nahi ez duzuna kendu eta gehitzen duzu.',
        'Markatu entrega bakoitzaren laukia amaitzen duzunean.',
      ],
    },
    ia: {
      titulo: 'AAren laguntza (Plus plana)',
      resumen: 'AAk proposatu eta zuk erabakitzen duzu: ez da ezer gordetzen zuk berrikusi gabe.',
      pasos: [
        'Ireki zeregin bat eta, «AAren laguntza» atalean, sakatu Zatitu urratsetan azpizeregin txiki bihurtzeko.',
        'Azterketa batean, sakatu Ikasketa-plana datara arte: AAk saio laburrak banatzen ditu azterketa-egunera arte, amaieran errepasoarekin. Aldatu testua edo desmarkatu nahi ez dituzunak eta gehitu: zure Agendan agertzen dira.',
        'Ordutegiaren, azterketa-egutegiaren eta agendaren argazkiak ere irakurtzen ditu (Ordutegian eta Planifikatzailean).',
        'Plus planak hilean 100 erabilera ditu, zure seme-alaben kontuekin partekatuak lotuta badituzu. Zenbat daramatzazun Ezarpenak atalean ikusten duzu, Zure plana txartelean.',
      ],
    },
    pomodoro: {
      titulo: 'Pomodoroa eta estatistikak',
      resumen: 'Kontzentratu bloke laburretan atsedenaldiekin, eta ikusi zertan joaten zaizun denbora.',
      pasos: [
        'Aukeratu landuko duzun zeregina (aukerakoa) eta sakatu Hasi. Blokea amaitzean abisu batek jotzen du eta atsedenaldia hasten da.',
        'Iraupena zure adinera egokitzen da (txikienei, bloke laburragoak). Doitu tenporizadorea atalean alda dezakezu.',
        'Estatistikak atalean dituzu kontzentrazio-denbora etiketaka edo irakasgaika, zure helburuen aurrerapena, eguneko jarduera eta kalkulatutako denbora benetakoaren aldean.',
        'Estatistikak CSV formatuan esportatu edo PDFan inprimatu ditzakezu.',
      ],
    },
    revision: {
      titulo: 'Asteko berrikuspena eta oroigarriak',
      resumen: 'Ezer ahaztu ez dezazun: astero errepaso bat eta abisuak garaiz.',
      pasos: [
        'Asteko berrikuspenak erakusten dizkizu iraungitako zereginak, amaitutakoa, mugimendurik gabeko helburuak eta antolatzeko dauden zeregin solteak.',
        'Oroigarriak atalean sortu alarmak: asteko berrikuspena (eguna eta ordua), muga-data bakoitzaren aurretik edo oporren aurretik. Bakoitza posta elektronikoz ere irits dakizuke.',
        'Larrialdi moduak alarma bat jotzen du zain dagoen zeregin bat hainbat egunetan ukitu gabe badago.',
        'Aplikazioa itxita dagoela abisuak jasotzeko, aktibatu itzazu Ezarpenak atalean, Abisuak gailu honetan txartelean.',
      ],
    },
    familia: {
      titulo: 'Familia',
      resumen: 'Lotu zure kontua zure aita, ama edo tutorearenarekin (edo zure seme-alabarenarekin) zereginak elkarrekin berrikusteko.',
      pasos: [
        'Berrikusiko denak kode bat sortzen du Familia atalean eta aurrez aurre ematen dio helduari, eta honek bere kontuan sartzen du. Kodeak behin balio du eta 48 ordutan iraungitzen da.',
        'Kontua adingabe batena bada, lotzean helduak berretsi ere egiten du: berrespen hori gabe ezin da erabili.',
        'Berrikuspena eskatzeko, ireki zeregina, aukeratu nork berrikusiko duen eta markatu Eginda gisa. Helduak onartu edo iruzkin batekin itzultzen du, eta abisu bat jasotzen duzu.',
        'Helduak zereginak esleitu ditzake eta erabaki dezake bere seme-alabak bere planeko AA erabil dezakeen. Bidaltzen zaizkion edo esleitu dituen zereginak baino ez ditu ikusten, inoiz ez kontuaren gainerakoa.',
      ],
    },
    ajustes: {
      titulo: 'Ezarpenak, hizkuntza eta mugikorra',
      resumen: 'Egokitu FocusFlow zuretzat eta eraman mugikorrean.',
      pasos: [
        'Menuaren behealdean aldatzen dituzu hizkuntza (gaztelania, valentziera, galiziera, euskara, katalana eta ingelesa) eta modu argia edo iluna.',
        'Ezarpenak atalean zure profila aukeratzen duzu, zure plana ikusten duzu, eskola modua aktibatzen duzu, Google Calendar eta Google Classroom konektatzen dituzu eta, nahi baduzu, zure kontua ezabatzen duzu.',
        'Mugikorrean edo tabletan beste aplikazio bat bezala izateko, ireki focusflowup.com nabigatzailean eta aukeratu Instalatu aplikazioa edo Gehitu hasierako pantailan. Gero aktibatu abisuak Ezarpenak atalean.',
      ],
    },
  },
  videos: {
    horarioFoto: 'Ordutegiaren argazkia aukeratzen da, AAk segundo gutxitan irakurtzen du eta, berrikusi ondoren, sarean aplikatzen da.',
    examenesFoto: 'Eskuz idatzitako azterketa-egutegi baten argazkia: AAk 6 entregak ateratzen ditu beren data, mota eta irakasgaiarekin.',
    deberesFoto: 'Agendako orri baten argazkia: etxeko lanak beren irakasgaiarekin eta datarekin agertzen dira.',
    planEstudio: 'Matematikako azterketa baterako ikasketa-plana: saio bat desmarkatzen da, gainerakoak gehitzen dira eta Agendan agertzen dira.',
    agenda: 'Astea klaseekin, etxeko lanekin eta ikasketa-saioekin; gero, hilabeteko ikuspegia azterketekin.',
    pomodoroEstadisticas: 'Pomodoro bat Matematikako etxeko lan batzuen gainean eta, Estatistiketan, kontzentrazio-denbora irakasgaika.',
    familiaPedirRevision: 'Ikasleak aukeratzen du nork berrikusiko dituen bere etxeko lanak eta eginda bezala markatzen ditu.',
    familiaRevisar: 'Amak etxeko lanak onartzen ditu, bere alabaren AAren laukia eta bere Plus plana ikusten ditu Ezarpenetan.',
    idiomaTema: 'Hizkuntza valentzierara aldatzea, modu iluna eta ingelesera aldatzea.',
    movil: 'FocusFlow mugikorrean: Hasiera, menua eta eguneko agenda.',
  },
};
