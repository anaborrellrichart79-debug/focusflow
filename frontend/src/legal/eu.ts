import type { TextosLegales } from './tipos';

// es.ts-ren itzulpena (erreferentziazko bertsioa).
export const eu: TextosLegales = {
  privacidad: {
    titulo: 'Pribatutasun-politika',
    secciones: [
      {
        titulo: '1. Nor den zure datuen arduraduna',
        bloques: [
          'FocusFlow (https://focusflowup.com) Ana Borrell Richarten zerbitzu bat da, IFZ 21673526M, helbidea 03820 Cocentaina (Alacant), Espainia. Zure datuei buruzko edozein zalantzatarako idatzi privacidad@focusflowup.com helbidera.',
          'Zure datuak Europar Batasuneko Datuak Babesteko Erregelamendu Orokorraren (DBEO, (EB) 2016/679 Erregelamendua), Datu Pertsonalak Babesteko eta Eskubide Digitalak Bermatzeko 3/2018 Lege Organikoaren (LOPDGDD) eta Informazioaren Gizartearen Zerbitzuei buruzko 34/2002 Legearen (LSSI) arabera tratatzen ditugu.',
        ],
      },
      {
        titulo: '2. Zer datu tratatzen ditugun',
        bloques: [
          {
            lista: [
              'Kontuaren datuak: izena (aukerakoa), helbide elektronikoa, pasahitza (zifratuta gordeta; inork ezin du ikusi), jaiotze-data, adingabeen kasuan guraso edo tutorearen helbide elektronikoa, hizkuntza eta hobespenak.',
              'Aplikazioan idazten duzuna: helburuak, zereginak eta azpizereginak, oharrak eta To-Do zerrendak, etiketak, klase-ordutegia, azterketak, lanak eta etxeko lanak, Pomodoro saioak, oroigarriak, abisuak eta horrekin guztiarekin kalkulatzen diren estatistikak.',
              'Familia-lotura: zer kontu dauden lotuta, berrikusteko bidaltzen dituzun edo esleitzen dizkizuten zereginak eta berrikuspeneko iruzkinak.',
              'Google, konektatzen baduzu bakarrik: Googlek ematen dituen sarbide-baimenak; zure Google Calendarreko hurrengo 30 egunetako gertaerak (izenburua eta data), zeregin gisa ekartzen direnak; eta, Classroom konektatzen baduzu, egiteke dituzun lanak (izenburua, deskribapena, entrega-data, esteka eta klasearen izena), irakurtzeko soilik.',
              'Jakinarazpenak: abisuak aktibatzen badituzu, zure nabigatzaileak edo gailuak sortzen duen harpidetza-helbidea.',
              'Argazkiak (Plus plana): AAk irakur dezan igotzen duzun ordutegiaren, azterketa-egutegiaren edo agendaren argazkia. Irakurketa horretarako bakarrik erabiltzen da eta ez da gordetzen.',
              'AAren erabilera: erabilera bakoitzaren data eta mota, planaren hileko mugarako.',
              'Zerbitzariaren erregistro teknikoak (IP helbidea, data eta eskaera), segurtasunerako eta akatsak konpontzeko.',
            ],
          },
          'Ez dugu publizitate- edo jarraipen-cookierik ez analitika-tresnarik erabiltzen. Zure nabigatzaileak aplikazioak funtzionatzeko ezinbestekoa baino ez du gordetzen: hasitako saioa, hizkuntza, gai argia edo iluna eta abisuak aktibatuta dauden ala ez.',
        ],
      },
      {
        titulo: '3. Zertarako erabiltzen ditugun eta zer oinarri juridikorekin',
        bloques: [
          {
            lista: [
              'Kontua sortzean eskatzen duzun zerbitzua emateko: zure zereginak gorde eta antolatzeko, egiaztapen-, baimen- eta abisu-mezuak eta jakinarazpenak bidaltzeko (kontratua betetzea, DBEOren 6.1.b artikulua).',
              'Plus planeko AAren laguntzarako, erabiltzen duzunean (kontratua betetzea).',
              'Google Calendar eta Google Classroom konektatzeko, zuk erabakitzen baduzu bakarrik (baimena, DBEOren 6.1.a artikulua). Edozein unetan kendu dezakezu Ezarpenetan Google deskonektatuta.',
              'Zerbitzua seguru mantentzeko eta akatsak konpontzeko (interes legitimoa, DBEOren 6.1.f artikulua).',
              'Dagozkion lege-betebeharrak betetzeko (DBEOren 6.1.c artikulua).',
            ],
          },
          'Ez ditugu zure datuak saltzen, ez ditugu publizitaterako erabiltzen eta ez dugu zure profilik egiten.',
        ],
      },
      {
        titulo: '4. Adingabeak',
        bloques: [
          'Espainiako legeak adingabe batek 14 urtetik aurrera baimena eman dezan uzten du. FocusFlow babesleagoa da: 18 urtetik beherako pertsona baten kontu orok bere gurasoak edo tutoreak berretsi behar du erabili aurretik, posta bidez jasotzen duen esteka batekin edo familia-loturako kode batekin.',
          'Lotutako pertsona helduak adingabeak berrikusteko bidaltzen dizkion zereginak edo berak esleitzen dizkionak baino ez ditu ikusten; inoiz ez kontuaren gainerakoa.',
          'Bere Familia orritik, pertsona helduak edozein unetan itzali dezake AAren laguntza adingabearen kontuan. Adingabearen datuetarako sarbidea edo datuak ezabatzea ere eska diezaguke privacidad@focusflowup.com helbidera idatzita.',
        ],
      },
      {
        titulo: '5. Adimen artifiziala (Plus plana)',
        bloques: [
          'AAren laguntzak (zeregin bat urratsetan banatu, ikasketa-plan bat prestatu, oroigarriak idatzi eta ordutegiaren, azterketen edo agendaren argazkiak irakurri) Anthropic, PBC-ren (Estatu Batuak) Claude ereduak erabiltzen ditu. Plus plana duten kontuetan bakarrik erabiltzen da, edo plan hori duen pertsona heldu bati lotutako adingabe batenetan, betiere familiak itzali ez badu.',
          'Zer bidaltzen zaion Anthropici: zereginaren izenburua, deskribapena eta datak, irakasgaia, zure ordutegiko irakasgaien izenak, aplikazioaren hizkuntza eta, erabiltzen baduzu, igotzen duzun argazkia. Oroigarrietarako, egiteke dituzun zereginen izenburuak eta datak. Ez da bidaltzen zure izena, zure helbide elektronikoa ezta zure jaiotze-data ere.',
          'Anthropicek datu horiek tratamenduaren eragile gisa tratatzen ditu, bere datu-tratamenduko hitzarmenaren arabera, eta bere baldintza komertzialen arabera ez ditu bere ereduak entrenatzeko erabiltzen.',
          'AAk proposamenak baino ez ditu egiten: ez da ezer gordetzen zuk berrikusi eta onartu arte.',
        ],
      },
      {
        titulo: '6. Norekin partekatzen ditugun datuak',
        bloques: [
          'Zerbitzua emateko behar ditugun hornitzaileekin bakarrik; tratamenduaren eragile gisa jarduten dute eta datuak horretarako bakarrik erabil ditzakete:',
          {
            lista: [
              'Hetzner Online GmbH (Alemania): zerbitzaria eta datu-basea, Falkensteingo (Alemania) datu-zentroan.',
              'Resend, Inc.: mezu elektronikoak bidaltzea.',
              'Cloudflare, Inc.: focusflowup.com domeinua eta harremanetarako helbidearen birbidalketa.',
              'Anthropic, PBC: Plus planeko AA (ikus 5. atala).',
              'Nabigatzailearen edo sistemaren jakinarazpen-zerbitzuak (Google, Apple edo Mozilla, zure gailuaren arabera), abisuak aktibatzen badituzu horiek entregatzen dituztenak.',
              'Google, zure kontua konektatzen baduzu bakarrik: FocusFlowk zure zereginen gertaerak sortu eta eguneratzen ditu zure Google Calendarren eta zure Classroomeko lanak irakurtzen ditu.',
            ],
          },
          'Hornitzaile horietako batzuk Estatu Batuetakoak dira edo han trata ditzakete datuak. Nazioarteko transferentzia horiek DBEOren bermeekin egiten dira: Europako Batzordearen egokitasun-erabaki batekin edo Batzordeak onartutako kontratu-klausula tipoekin.',
        ],
      },
      {
        titulo: '7. Googleren datuak',
        bloques: [
          'Googleren APIetatik jasotako informazioaren erabilera eta beste edozein aplikaziotara egiten den transferentzia Googleren API Zerbitzuetako Erabiltzaile-datuen Politikara egokitzen da, erabilera mugatuko baldintzak barne.',
          'Zehazki: Google Calendarreko eta Google Classroomeko datuak zure gertaerak eta lanak FocusFlown zeregin gisa erakusteko eta sinkronizatuta mantentzeko bakarrik erabiltzen dira; ez dira publizitaterako erabiltzen, ez dira saltzen eta inork ez ditu irakurtzen zuk eskatzen ez baduzu edo legeak eskatzen ez badu. Zeregin horietako batean Plus planeko AA erabiltzen baduzu, funtzio hori emateko behar dena baino ez da bidaltzen, inoiz ez AA ereduak entrenatzeko.',
        ],
      },
      {
        titulo: '8. Zenbat denbora gordetzen ditugun datuak',
        bloques: [
          {
            lista: [
              'Kontua duzun bitartean. Ezarpenetatik ezabatzen duzunean, zure kontua eta haren eduki guztia berehala ezabatzen dira, eta Googleren baimena kentzen da.',
              'Datu-basearen segurtasun-kopiak egunero egiten dira eta 14 egunez gordetzen dira; epe hori igarotakoan ezabatu egiten dira.',
              'Google deskonektatzean, sarbide-baimenak eta egutegiko gertaerekiko lotura ezabatzen dira.',
              'AAk irakurtzen dituen argazkiak ez dira gordetzen.',
              'Zerbitzariaren erregistro teknikoak 14 egunez gordetzen dira.',
            ],
          },
        ],
      },
      {
        titulo: '9. Zure eskubideak',
        bloques: [
          'Zure datuak eskuratu, zuzendu eta ezabatu ditzakezu, haien tratamenduaren aurka egin, mugatzeko eskatu, beste zerbitzu batera eraman (eramangarritasuna) eta emandako baimena kendu, lehenago egindakoari eragin gabe.',
          'Gauza asko zuk zeuk egin ditzakezu aplikaziotik: idazten duzuna editatu edo ezabatu, Google deskonektatu eta zure kontua Ezarpenetan ezabatu. Gainerakorako, idatzi privacidad@focusflowup.com helbidera; gehienez hilabeteko epean erantzungo dizugu.',
          'Zure datuak behar bezala tratatu ez ditugula uste baduzu, Datuak Babesteko Espainiako Agentziaren aurrean erreklamatu dezakezu (www.aepd.es).',
        ],
      },
      {
        titulo: '10. Segurtasuna',
        bloques: [
          'Komunikazio guztia zifratuta doa (HTTPS), pasahitzak zifratuta gordetzen dira, zerbitzaria Europar Batasunean dago, egunero egiten dira segurtasun-kopiak eta zerbitzarirako sarbidea mugatuta dago.',
        ],
      },
      {
        titulo: '11. Politika honen aldaketak',
        bloques: [
          'Politika hau aldatzen badugu, orri honetan adieraziko dugu data berriarekin eta, aldaketa garrantzitsua bada, aplikazioan edo posta bidez jakinaraziko dizugu.',
        ],
      },
    ],
  },
  condiciones: {
    titulo: 'Zerbitzuaren baldintzak',
    secciones: [
      {
        titulo: '1. Nork eskaintzen duen zerbitzua',
        bloques: [
          'FocusFlow (https://focusflowup.com) Ana Borrell Richarten zerbitzu bat da, IFZ 21673526M, helbidea 03820 Cocentaina (Alacant), Espainia. Harremanetarako: privacidad@focusflowup.com.',
          'Kontu bat sortzean baldintza hauek eta gure pribatutasun-politika onartzen dituzu.',
        ],
      },
      {
        titulo: '2. Zer den FocusFlow',
        bloques: [
          'Antolatzeko eta atzeratzeko ohitura gainditzeko web-aplikazio bat: helburuak, zereginak, Kanban, Eisenhowerren Matrizea, Pomodoro, agenda, estatistikak eta eskola-modu bat ordutegiarekin, azterketekin, lanekin eta etxeko lanekin, familientzat ere pentsatua.',
        ],
      },
      {
        titulo: '3. Zure kontua',
        bloques: [
          {
            lista: [
              'Izena ematean ematen dituzun datuek egiazkoak izan behar dute, batez ere jaiotze-datak.',
              '18 urte baino gutxiago badituzu, zure gurasoak edo tutoreak zure kontua berretsi behar du erabili ahal izan aurretik.',
              'Zure pasahitza pertsonala da: ez partekatu. Norbaitek dakiela uste baduzu, aldatu edo idatzi iezaguzu.',
            ],
          },
        ],
      },
      {
        titulo: '4. Planak',
        bloques: [
          {
            lista: [
              'Plan doakoa: antolatzeko funtzio guztiak, AAren laguntzarik gabe.',
              'Plus plana: AAren laguntza gehitzen du, Ezarpenetan adierazten den hileko gehieneko erabilera kopuruarekin. Plan hori duen pertsonari lotutako adingabeak ere estaltzen ditu (familia-plana), pertsona horrek AA itzaltzen ez badie.',
              'Plus planaren prezioa, ordainketa-modua eta berritze- eta ezeztatze-baldintzak kontratatu aurretik erakutsiko dira. Aldatzen badira, aldez aurretik jakinaraziko da.',
            ],
          },
        ],
      },
      {
        titulo: '5. AAren laguntza',
        bloques: [
          'AAren proposamenek akatsak izan ditzakete: berrikusi beti onartu aurretik. AAk ez ditu irakasleak ezta familia ere ordezkatzen.',
          'Igo zure ordutegiaren, azterketen edo agendaren argazkiak bakarrik, eta saihestu beharrezkoak ez diren beste pertsona batzuen datu pertsonalak agertzea.',
        ],
      },
      {
        titulo: '6. Erabilera onargarria',
        bloques: [
          'Ezin duzu FocusFlow legez kanpoko ezertarako erabili, beste pertsona batzuen kontuetan sartzen saiatu, zerbitzua gainkargatu edo eraso, ezta modu automatikoan erabili antolatzeaz bestelako helburuetarako ere.',
        ],
      },
      {
        titulo: '7. Zure edukia',
        bloques: [
          'FocusFlown idazten duzuna zurea da. Zerbitzua emateko behar den neurrian gordetzeko eta prozesatzeko baimena baino ez diguzu ematen, pribatutasun-politikan azaltzen den bezala.',
        ],
      },
      {
        titulo: '8. Hirugarrenen zerbitzuak',
        bloques: [
          'Google Calendar edo Google Classroom konektatzen badituzu, horien erabilera Googleren baldintzen menpe ere badago. Nahi duzunean deskonekta ditzakezu Ezarpenetatik.',
        ],
      },
      {
        titulo: '9. Erabilgarritasuna eta erantzukizuna',
        bloques: [
          'Ahal duguna egiten dugu FocusFlowk beti funtziona dezan eta zure datuak seguru egon daitezen, baina etenaldiak egon daitezke mantentze-lanengatik edo gure esku ez dauden arrazoiengatik. Legeak uzten duen neurrian, ez gara zerbitzuaren etenaldi batetik etor daitezkeen zeharkako kalteen erantzule. Baldintza hauetan esaten den ezerk ez ditu mugatzen kontsumitzaileen araudiak aitortzen dizkizun eskubideak.',
        ],
      },
      {
        titulo: '10. Baja',
        bloques: [
          'Nahi duzunean ezabatu dezakezu zure kontua Ezarpenetatik. Baldintza hauek betetzen ez dituen kontu bat eten edo itxi dezakegu, aldez aurretik jakinarazita, premiazkoa ez bada behintzat.',
        ],
      },
      {
        titulo: '11. Baldintzen aldaketak',
        bloques: [
          'Baldintza hauek aldatzen baditugu, orri honetan adieraziko dugu data berriarekin eta, aldaketa garrantzitsua bada, aldez aurretik jakinaraziko dizugu aplikazioan edo posta bidez.',
        ],
      },
      {
        titulo: '12. Lege aplikagarria',
        bloques: [
          'Baldintza hauek Espainiako legeak arautzen ditu. Kontsumitzailea bazara, zure bizilekuko auzitegietara jo dezakezu.',
        ],
      },
    ],
  },
};
