import {
  temporaryLegalVersion,
  type LegalContentMetadata,
  type PrivacyNoticeContent,
} from "./legal-content.ts";

type Locale = "tr" | "en";
type SeedRouteKey =
  | "privacy"
  | "cookies"
  | "data-protection"
  | "contact"
  | "career-apply";

type SeedBlock = {
  eyebrow?: string;
  heading: string;
  body: readonly string[];
};

export type TemporaryCmsSeedPage = {
  routeKey: SeedRouteKey;
  locale: Locale;
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  allowIndexing: false;
  content: {
    schemaVersion: 1;
    hero: SeedBlock;
    sections: Record<string, never>;
    legalBlocks: readonly SeedBlock[];
    legal_status?: "temporary";
    legal_version?: typeof temporaryLegalVersion;
    requires_legal_review?: true;
    privacyNotice?: PrivacyNoticeContent;
  };
};

const temporaryMetadata = {
  legal_status: "temporary",
  legal_version: temporaryLegalVersion,
  requires_legal_review: true,
} as const satisfies LegalContentMetadata;

export const temporaryPrivacyNotices = {
  career: {
    tr: {
      ...temporaryMetadata,
      heading: "Kariyer Başvurusu Aydınlatması",
      body: [
        "İletişim bilgileriniz; başvurduğunuz departman ve lokasyon; ücret beklentiniz; işe başlayabileceğiniz tarih; CV'niz ve formda verdiğiniz diğer bilgiler başvurunuzu almak, güvenli biçimde saklamak ve işe alım değerlendirmesini yürütmek amacıyla işlenir.",
        "Aday kaydına yalnız yetkili HR ve Super Admin kullanıcıları erişebilir. CV, yüklemeden sonra karantinada tutulur; yalnız güvenlik taraması temiz sonuçlandığında korumalı alana alınır ve yetkili indirmeye açılır.",
        "Veriler, yürürlükteki ve onaylı saklama politikası kapsamında tutulur; süre sonunda silme veya anonimleştirme mekanizmaları uygulanır. 6698 sayılı Kanun kapsamındaki haklarınızı KVKK Aydınlatma Metni'nde açıklanan kanallarla kullanabilirsiniz.",
      ],
      acknowledgement_label: "KVKK Aydınlatma Metni'ni okudum.",
      related_route_key: "data-protection",
    },
    en: {
      ...temporaryMetadata,
      heading: "Career Application Privacy Notice",
      body: [
        "Your contact details, selected department and location, salary expectation, availability date, CV, and other information you provide in the form are processed to receive your application, store it securely, and conduct recruitment evaluation.",
        "Candidate records are accessible only to authorized HR and Super Admin users. A CV remains quarantined after upload; it is moved to protected storage and made available for authorized download only after a clean security scan.",
        "Data is retained under the applicable approved retention policy and is deleted or anonymized when the approved period ends. You may exercise your rights under Turkish Law No. 6698 through the channels described in the Data Protection Notice.",
      ],
      acknowledgement_label: "I have read the Data Protection Notice under Turkish Law No. 6698.",
      related_route_key: "data-protection",
    },
  },
  contact: {
    tr: {
      ...temporaryMetadata,
      heading: "İletişim Formu Aydınlatması",
      body: [
        "Adınız, e-posta adresiniz, paylaşmanız hâlinde telefon ve firma bilginiz ile konu ve mesaj içeriğiniz; iletişim talebinizi almak, değerlendirmek ve yanıtlamak amacıyla işlenir.",
        "Kayıt yalnız yetkili Contact Manager ve Super Admin kullanıcılarına açıktır. Veriler yürürlükteki ve onaylı saklama politikası kapsamında tutulur; 6698 sayılı Kanun kapsamındaki haklarınızı KVKK Aydınlatma Metni'nde açıklanan kanallarla kullanabilirsiniz.",
      ],
      acknowledgement_label: "KVKK Aydınlatma Metni'ni okudum.",
      related_route_key: "data-protection",
    },
    en: {
      ...temporaryMetadata,
      heading: "Contact Form Privacy Notice",
      body: [
        "Your name, email address, telephone number and company information when provided, together with the subject and message, are processed to receive, assess, and respond to your contact request.",
        "The record is accessible only to authorized Contact Manager and Super Admin users. Data is retained under the applicable approved retention policy, and you may exercise your rights under Turkish Law No. 6698 through the channels described in the Data Protection Notice.",
      ],
      acknowledgement_label: "I have read the Data Protection Notice under Turkish Law No. 6698.",
      related_route_key: "data-protection",
    },
  },
} as const satisfies Record<
  "career" | "contact",
  Record<Locale, PrivacyNoticeContent>
>;

const legalPages = [
  {
    routeKey: "privacy",
    locale: "tr",
    slug: "gizlilik",
    title: "Gizlilik Politikası",
    seoTitle: "Gizlilik Politikası",
    seoDescription: "Ardaş Yedek Parça web sitesi gizlilik politikası.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Gizlilik", heading: "Gizlilik Politikası", body: [] },
      sections: {},
      legalBlocks: [
        {
          heading: "1. Kapsam ve yaklaşım",
          body: [
            "Ardaş Yedek Parça, kurumsal web sitesini kullanan ziyaretçilerin ve formlar üzerinden bilgi paylaşan kişilerin kişisel verilerinin gizliliğine önem verir. Bu politika, web sitesi kapsamındaki temel veri işleme yaklaşımını açıklar.",
            "Faaliyet bazlı ayrıntılar, ilgili formda gösterilen kısa aydınlatma metni ve KVKK Aydınlatma Metni ile birlikte değerlendirilmelidir.",
          ],
        },
        {
          heading: "2. İşlenebilecek veri kategorileri",
          body: [
            "Web sitesi üzerinden ad, soyad, e-posta, telefon ve firma gibi iletişim bilgileri; iletişim formundaki konu ve mesaj; kariyer başvurusundaki departman, lokasyon, ücret beklentisi, uygunluk tarihi, adayın verdiği diğer bilgiler ve CV işlenebilir.",
            "Ayrıca hizmetin işletilmesi ve korunması için sınırlı teknik, güvenlik, oturum, hata ve işlem kayıtları oluşturulabilir.",
          ],
        },
        {
          heading: "3. İşleme amaçları",
          body: [
            "Veriler; iletişim taleplerini almak ve yanıtlamak, iş başvurularını değerlendirmek, web sitesini ve ilgili sistemleri işletmek, güvenliği ve kötüye kullanım önlemlerini sağlamak, kayıt bütünlüğünü korumak ve uygulanabilir hukuki yükümlülükleri yerine getirmek amacıyla işlenir.",
          ],
        },
        {
          heading: "4. Toplama yöntemi ve hukuki çerçeve",
          body: [
            "Veriler doğrudan web formları, güvenli yönetim işlemleri ve sistemin çalışması sırasında oluşan teknik kayıtlar yoluyla elektronik ortamda elde edilir. İşleme, 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili mevzuatta yer alan, somut faaliyete uygun işleme şartlarına dayanır.",
            "Aydınlatma metninin okunduğuna ilişkin kayıt, tek başına açık rıza veya başka bir hukuki sebep yerine geçmez. Açık rıza gerektiren ayrı bir faaliyet tanımlanırsa bu süreç ayrıca yürütülür.",
          ],
        },
        {
          heading: "5. Güvenlik",
          body: [
            "Yetki kontrollü erişim, çok faktörlü yönetici kimlik doğrulaması, korumalı dosya saklama, CV güvenlik taraması, kayıt minimizasyonu, güvenli aktarım ve PII-safe loglama gibi teknik ve idari önlemler uygulanır.",
          ],
        },
        {
          heading: "6. Saklama, silme ve anonimleştirme",
          body: [
            "Kişisel veriler yalnız ilgili amaç ve uygulanabilir yükümlülükler için gerekli süre boyunca saklanır. Onaylı saklama politikası kapsamındaki sürenin sonunda silme veya anonimleştirme mekanizmaları işletilir. Kesin süreler, onaylı kurumsal saklama politikasında belirlenir.",
          ],
        },
        {
          heading: "7. Hizmet sağlayıcılar ve aktarımlar",
          body: [
            "Barındırma, veri tabanı, güvenli dosya saklama, zararlı yazılım tarama, kimlik doğrulama, e-posta ve izleme hizmeti sunan yetkili sağlayıcılardan yalnız gerekli olduğu ölçüde yararlanılabilir. Kanunen yetkili kurum ve kuruluşlarla da yasal zorunluluk kapsamında paylaşım yapılabilir.",
            "Yurt dışında bulunan bir hizmet sağlayıcıya kişisel veri aktarımı doğarsa yürürlükteki mevzuatın gerektirdiği uygun aktarım şartları ve güvenceler tamamlanmadan aktarım yapılmamalıdır. Bu metin herhangi bir sözleşme veya aktarım güvencesinin tamamlandığı iddiasını içermez.",
          ],
        },
        {
          heading: "8. Haklar ve güncellemeler",
          body: [
            "İlgili kişiler, 6698 sayılı Kanun kapsamındaki bilgi alma, düzeltme, silme veya yok etme talep etme, aktarılan üçüncü kişileri bilme, otomatik analiz sonucuna itiraz etme ve kanuna aykırı işleme nedeniyle zarar doğmuşsa giderim talep etme haklarına sahiptir.",
            `Politika değişiklikleri yeni bir CMS revizyonu ve sürüm numarasıyla yayımlanır. Form kayıtları, kendilerine gösterilen notice sürümünü korur. Mevcut sürüm: ${temporaryLegalVersion}.`,
          ],
        },
      ],
      ...temporaryMetadata,
    },
  },
  {
    routeKey: "privacy",
    locale: "en",
    slug: "privacy",
    title: "Privacy Policy",
    seoTitle: "Privacy Policy",
    seoDescription: "Privacy policy for the Ardaş Yedek Parça corporate website.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Privacy", heading: "Privacy Policy", body: [] },
      sections: {},
      legalBlocks: [
        {
          heading: "1. Scope and approach",
          body: [
            "Ardaş Yedek Parça values the privacy of visitors to its corporate website and people who provide information through its forms. This policy explains the website's basic approach to personal-data processing.",
            "It should be read together with the activity-specific short notice shown in the relevant form and the Data Protection Notice under Turkish Law No. 6698.",
          ],
        },
        {
          heading: "2. Categories of data",
          body: [
            "The website may process contact details such as name, surname, email, telephone number, and company; the subject and message sent through the contact form; and career-application information including department, location, salary expectation, availability date, other information provided by the candidate, and the CV.",
            "Limited technical, security, session, error, and transaction records may also be created to operate and protect the service.",
          ],
        },
        {
          heading: "3. Purposes of processing",
          body: [
            "Data is processed to receive and respond to contact requests, evaluate job applications, operate the website and related systems, maintain security and abuse controls, protect record integrity, and comply with applicable legal obligations.",
          ],
        },
        {
          heading: "4. Collection and legal framework",
          body: [
            "Data is obtained electronically through information entered directly into web forms, secure administration activities, and technical records generated while the system operates. Processing relies on the conditions applicable to the specific activity under Turkish Law No. 6698 and related legislation.",
            "A record confirming that a notice was read does not itself constitute explicit consent or replace another legal basis. If a separate activity requiring explicit consent is introduced, that process must be conducted separately.",
          ],
        },
        {
          heading: "5. Security",
          body: [
            "Technical and administrative safeguards include permission-controlled access, multi-factor administrator authentication, protected file storage, CV security scanning, data minimisation, secure transmission, and PII-safe logging.",
          ],
        },
        {
          heading: "6. Retention, deletion, and anonymisation",
          body: [
            "Personal data is retained only for as long as necessary for the relevant purpose and applicable obligations. Deletion or anonymisation mechanisms are applied when the period under the approved retention policy ends. Exact periods are established in the approved corporate retention policy.",
          ],
        },
        {
          heading: "7. Service providers and transfers",
          body: [
            "Authorized providers may be used only to the extent necessary for hosting, databases, secure file storage, malware scanning, authentication, email, and monitoring. Data may also be disclosed to legally authorized public bodies where required by law.",
            "If personal data must be transferred to a provider outside Türkiye, the applicable transfer conditions and safeguards required by law must be completed first. This policy does not claim that any particular contract or transfer safeguard has already been completed.",
          ],
        },
        {
          heading: "8. Rights and updates",
          body: [
            "Data subjects have the rights provided by Turkish Law No. 6698, including requesting information, correction, deletion or destruction where applicable, learning the recipients of transfers, objecting to an adverse result produced exclusively by automated analysis, and seeking compensation for damage caused by unlawful processing.",
            `Policy changes are published as a new CMS revision and version. Form records retain the notice version shown at the time of submission. Current version: ${temporaryLegalVersion}.`,
          ],
        },
      ],
      ...temporaryMetadata,
    },
  },
  {
    routeKey: "data-protection",
    locale: "tr",
    slug: "kvkk",
    title: "KVKK Aydınlatma Metni",
    seoTitle: "KVKK Aydınlatma Metni",
    seoDescription: "6698 sayılı Kanun kapsamında genel web sitesi aydınlatma metni.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "6698 sayılı Kanun", heading: "KVKK Aydınlatma Metni", body: [] },
      sections: {},
      legalBlocks: [
        {
          heading: "1. Veri Sorumlusu",
          body: [
            "Bu internet sitesi kapsamındaki kişisel veri işleme faaliyetleri bakımından veri sorumlusunun doğrulanmış kimliği ve başvuru kanalları bu sayfada ve güncel kurumsal iletişim alanlarında yayımlanır.",
          ],
        },
        {
          heading: "2. İşlenen Kişisel Veri Kategorileri",
          body: [
            "İletişim bilgileri; iletişim formundaki firma, konu ve mesaj; kariyer başvurusundaki departman, lokasyon, ücret beklentisi, uygunluk tarihi, özgeçmiş bilgileri ve CV; ayrıca güvenlik, oturum, hata ve işlem kayıtları işlenebilir. Onaya tabi aday alanları yalnız ayrıca etkinleştirilmiş ve hukuken onaylanmışsa toplanır.",
          ],
        },
        {
          heading: "3. Kişisel Verilerin İşlenme Amaçları",
          body: [
            "Veriler; iletişim talebini almak, değerlendirmek ve yanıtlamak; aday başvurusunu almak, güvenli biçimde saklamak ve işe alım değerlendirmesini yürütmek; web sitesini işletmek; kimlik, yetki, dosya ve sistem güvenliğini sağlamak; kötüye kullanımı önlemek; hukuki yükümlülükleri ve yetkili merci taleplerini yerine getirmek amacıyla işlenir.",
          ],
        },
        {
          heading: "4. Kişisel Verilerin Toplanma Yöntemi",
          body: [
            "Kişisel veriler, ilgili kişinin web formlarına doğrudan girdiği bilgiler ve yüklediği CV ile; yönetim, güvenlik ve sistem işletimi sırasında otomatik olarak oluşan sınırlı teknik kayıtlar üzerinden elektronik ortamda toplanır.",
          ],
        },
        {
          heading: "5. Hukuki Sebepler",
          body: [
            "Veriler, 6698 sayılı Kanun'un 5. maddesinde yer alan; kanunlarda açıkça öngörülme, veri sorumlusunun hukuki yükümlülüğü, bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olma, bir hakkın tesisi, kullanılması veya korunması ve ilgili kişinin temel haklarına zarar vermemek kaydıyla meşru menfaat şartlarından somut faaliyete uygun olanına dayanılarak işlenir.",
            "Açık rıza gerektiren ayrı bir faaliyet tanımlanırsa aydınlatma ve açık rıza süreçleri birbirinden ayrı yürütülür. Aydınlatma metninin okunduğuna ilişkin kutu, açık rıza değildir.",
          ],
        },
        {
          heading: "6. Kişisel Verilerin Aktarılması",
          body: [
            "Veriler; barındırma, veri tabanı, güvenli dosya saklama, zararlı yazılım tarama, kimlik doğrulama, e-posta ve izleme hizmetlerini sunan yetkili sağlayıcılarla yalnız hizmetin gerektirdiği ölçüde ve uygulanabilir hukuki şartlar kapsamında paylaşılabilir. Kanunen yetkili kamu kurumlarıyla zorunlu hâllerde paylaşım yapılabilir.",
            "Yurt dışı aktarım doğarsa yürürlükteki mevzuatın gerektirdiği aktarım şartları ve güvenceler uygulanır; bu geçici metin sözleşmesel veya hukuki aktarım güvencelerinin tamamlandığı iddiasını içermez.",
          ],
        },
        {
          heading: "7. Saklama ve İmha",
          body: [
            "Kişisel veriler, işleme amacı ve uygulanabilir yükümlülükler için gerekli süreyle sınırlı olarak, yürürlükteki ve onaylı saklama politikası kapsamında tutulur. Süre sonunda silme, yok etme veya anonimleştirme mekanizmaları uygulanır. Kesin saklama süreleri onaylı kurumsal politika ve yürürlükteki uygulama ayarlarıyla belirlenir.",
          ],
        },
        {
          heading: "8. İlgili Kişinin Hakları",
          body: [
            "6698 sayılı Kanun'un 11. maddesi uyarınca kişisel verinizin işlenip işlenmediğini öğrenme; işlenmişse bilgi isteme; amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme; yurt içi veya yurt dışındaki alıcıları bilme; eksik veya yanlış verinin düzeltilmesini isteme haklarına sahipsiniz.",
            "Kanundaki şartlarla silme veya yok etme ve bunun alıcılara bildirilmesini isteme; münhasıran otomatik analizle aleyhinize doğan sonuca itiraz etme ve kanuna aykırı işleme nedeniyle zarar doğmuşsa giderim talep etme haklarınız da bulunmaktadır.",
          ],
        },
        {
          heading: "9. Başvuru / İletişim",
          body: [
            "Hak talepleri, bu internet sitesinde yayımlanan doğrulanmış veri sorumlusu iletişim kanallarına iletilebilir. Başvurunun kimliğinizi ve talebinizi doğrulamaya yetecek bilgileri içermesi gerekir; web sitesi bu amaçla doğrulanmamış adres veya e-posta yayımlamaz.",
          ],
        },
        {
          heading: "10. Güncellemeler",
          body: [
            `Bu metindeki değişiklikler yeni CMS revizyonu ve yeni hukuki metin sürümüyle yayımlanır. Kariyer ve iletişim kayıtları, başvuru sırasında gösterilen aydınlatma sürümünü korur. Mevcut sürüm: ${temporaryLegalVersion}.`,
          ],
        },
      ],
      ...temporaryMetadata,
    },
  },
  {
    routeKey: "data-protection",
    locale: "en",
    slug: "data-protection",
    title: "Data Protection Notice",
    seoTitle: "Data Protection Notice",
    seoDescription: "General website notice under Turkish Personal Data Protection Law No. 6698.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Turkish Law No. 6698", heading: "Data Protection Notice", body: [] },
      sections: {},
      legalBlocks: [
        {
          heading: "1. Data Controller",
          body: [
            "The verified identity of the data controller and the application channels for personal-data processing activities within this website are published on this page and in the current corporate contact areas.",
          ],
        },
        {
          heading: "2. Categories of Personal Data",
          body: [
            "Data may include contact details; company, subject, and message information from the contact form; department, location, salary expectation, availability date, résumé information, and CV from a career application; and limited security, session, error, and transaction records. Approval-gated candidate fields are collected only if separately enabled and legally approved.",
          ],
        },
        {
          heading: "3. Purposes of Processing",
          body: [
            "Data is processed to receive, assess, and respond to contact requests; receive, securely store, and evaluate candidate applications; operate the website; maintain identity, permission, file, and system security; prevent abuse; and meet legal obligations and valid requests from competent authorities.",
          ],
        },
        {
          heading: "4. Method of Collection",
          body: [
            "Personal data is collected electronically through information entered directly into web forms and CVs uploaded by the data subject, together with limited technical records generated automatically during administration, security, and system operation.",
          ],
        },
        {
          heading: "5. Legal Grounds",
          body: [
            "Processing relies on the condition appropriate to the specific activity under Article 5 of Turkish Law No. 6698, including where processing is expressly provided by law, is necessary for a legal obligation, is directly related to establishing or performing a contract, is necessary for establishing, exercising, or protecting a right, or is necessary for legitimate interests without harming fundamental rights.",
            "If a separate activity requiring explicit consent is introduced, the information and consent processes are conducted separately. A checkbox confirming that this notice was read is not explicit consent.",
          ],
        },
        {
          heading: "6. Transfers of Personal Data",
          body: [
            "Data may be shared only to the extent necessary and under the applicable legal conditions with authorized providers of hosting, databases, secure file storage, malware scanning, authentication, email, and monitoring services. It may be disclosed to legally authorized public bodies where required.",
            "Where a transfer outside Türkiye arises, the transfer conditions and safeguards required by applicable law must be used. This temporary notice does not claim that contractual or legal transfer safeguards have already been completed.",
          ],
        },
        {
          heading: "7. Retention and Disposal",
          body: [
            "Personal data is retained only for as long as necessary for the purpose and applicable obligations, under the applicable approved retention policy. Deletion, destruction, or anonymisation mechanisms are applied when that period ends. Exact periods are set by the approved policy and production configuration.",
          ],
        },
        {
          heading: "8. Rights of the Data Subject",
          body: [
            "Under Article 11 of Turkish Law No. 6698, you may learn whether your personal data is processed; request information; learn the purpose and whether the data is used accordingly; learn recipients in Türkiye or abroad; and request correction of incomplete or inaccurate data.",
            "Subject to the conditions in the Law, you may also request deletion or destruction and notification to recipients, object to an adverse result arising exclusively from automated analysis, and seek compensation for damage caused by unlawful processing.",
          ],
        },
        {
          heading: "9. Application / Contact",
          body: [
            "Rights requests may be sent through the verified data-controller contact channels published on this website. A request should contain enough information to verify your identity and the request; the website does not publish an unverified postal or email address for this purpose.",
          ],
        },
        {
          heading: "10. Updates",
          body: [
            `Changes are published as a new CMS revision and legal version. Career and contact records retain the privacy notice version displayed when the submission was made. Current version: ${temporaryLegalVersion}.`,
          ],
        },
      ],
      ...temporaryMetadata,
    },
  },
  {
    routeKey: "cookies",
    locale: "tr",
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    seoTitle: "Çerez Politikası",
    seoDescription: "Ardaş Yedek Parça web sitesinin güncel çerez ve tarayıcı depolama kullanımı.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Çerezler", heading: "Çerez Politikası", body: [] },
      sections: {},
      legalBlocks: [
        {
          heading: "1. Mevcut kullanım",
          body: [
            "Bu politika, web sitesinin güncel çerez ve tarayıcı depolama davranışını açıklar. Herkese açık kurumsal sayfalar ve formlar şu anda analitik, reklam veya kullanıcı takibi amacıyla çerez ya da tarayıcının yerel ve oturum depolama alanlarını (localStorage/sessionStorage) kullanmaz.",
          ],
        },
        {
          heading: "2. Kesinlikle gerekli çerezler",
          body: [
            "Yönetim panelinde Auth0 tabanlı güvenli oturum açma, oturumun korunması ve kimlik doğrulama işlemleri sırasında kesinlikle gerekli güvenlik ve oturum çerezleri kullanılabilir. Bu çerezler yönetim erişiminin güvenli çalışması için gereklidir ve reklam ya da ziyaretçi profilleme amacıyla kullanılmaz.",
            "Zorunlu çerezlerin engellenmesi yönetim paneli oturumunun çalışmasını engelleyebilir; herkese açık kurumsal içeriğin görüntülenmesi için yönetici oturumu gerekmez.",
          ],
        },
        {
          heading: "3. İşlevsel çerezler",
          body: [
            "Dil veya kişiselleştirme tercihini tarayıcıda saklayan zorunlu olmayan işlevsel bir çerez şu anda uygulanmamıştır. Böyle bir özellik eklenirse çerezin amacı, süresi, tarafı ve gerekli tercih mekanizması bu politika güncellenmeden etkinleştirilmez.",
          ],
        },
        {
          heading: "4. Analitik / performans çerezleri",
          body: [
            "Zorunlu olmayan analitik veya performans çerezi ve ziyaretçi davranışı takip aracı şu anda kullanılmamaktadır. Gelecekte analitik eklenirse, gerekli hukuki değerlendirme ve zorunlu olmayan çerezler için kullanıcı tercih/rıza mekanizması tamamlanmadan araç etkinleştirilmez.",
          ],
        },
        {
          heading: "5. Pazarlama / reklam çerezleri",
          body: [
            "Pazarlama, yeniden hedefleme veya kişiselleştirilmiş reklam çerezi/pikseli şu anda kullanılmamaktadır. Bu kategoride bir teknoloji varsayılan olarak devreye alınmaz.",
          ],
        },
        {
          heading: "6. Kontrol ve güncellemeler",
          body: [
            "Tarayıcı ayarlarınız üzerinden çerezleri görüntüleyebilir, silebilir veya engelleyebilirsiniz. Bir çerez kategorisi ya da sağlayıcısı değişirse politika yeni CMS revizyonu ve sürümle güncellenir; zorunlu olmayan teknolojiler gerekli tercih mekanizmasından önce yüklenmez.",
            `Mevcut sürüm: ${temporaryLegalVersion}.`,
          ],
        },
      ],
      ...temporaryMetadata,
    },
  },
  {
    routeKey: "cookies",
    locale: "en",
    slug: "cookie-policy",
    title: "Cookie Policy",
    seoTitle: "Cookie Policy",
    seoDescription: "Current cookie and browser-storage use on the Ardaş Yedek Parça website.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Cookies", heading: "Cookie Policy", body: [] },
      sections: {},
      legalBlocks: [
        {
          heading: "1. Current use",
          body: [
            "This policy describes the cookie and browser-storage behaviour in the website's current codebase. The public corporate pages and forms do not currently use cookies, localStorage, or sessionStorage for analytics, advertising, or visitor tracking.",
          ],
        },
        {
          heading: "2. Strictly necessary cookies",
          body: [
            "Strictly necessary security and session cookies may be used during Auth0-based secure sign-in, session maintenance, and authentication for the administration panel. They are required for secure administration access and are not used for advertising or visitor profiling.",
            "Blocking these cookies may prevent an administrator session from working. An administrator session is not required to view the public corporate content.",
          ],
        },
        {
          heading: "3. Functional cookies",
          body: [
            "No non-essential functional cookie currently stores language or personalisation preferences in the browser. If such a feature is added, its purpose, duration, party, and required preference mechanism must be documented before activation.",
          ],
        },
        {
          heading: "4. Analytics / performance cookies",
          body: [
            "No non-essential analytics or performance cookie or visitor-behaviour tracker is currently used. If analytics is introduced, it must not be activated until the required legal assessment and a user-choice-based consent mechanism for non-essential cookies are complete.",
          ],
        },
        {
          heading: "5. Marketing / advertising cookies",
          body: [
            "No marketing, retargeting, personalised-advertising cookie, or advertising pixel is currently used. Technology in this category is not enabled by default.",
          ],
        },
        {
          heading: "6. Controls and updates",
          body: [
            "You can view, delete, or block cookies through your browser settings. If a cookie category or provider changes, this policy is updated as a new CMS revision and version; non-essential technology is not loaded before the required preference mechanism is available.",
            `Current version: ${temporaryLegalVersion}.`,
          ],
        },
      ],
      ...temporaryMetadata,
    },
  },
] as const satisfies readonly TemporaryCmsSeedPage[];

const formNoticePages = [
  {
    routeKey: "contact",
    locale: "tr",
    slug: "iletisim",
    title: "İletişim",
    seoTitle: "İletişim",
    seoDescription: "Ardaş Yedek Parça iletişim formu.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Kurumsal iletişim", heading: "Doğru ekiple bağlantı kurun.", body: ["Kurumsal talebinizi güvenli iletişim formu üzerinden ilgili ekibe iletin."] },
      sections: {},
      legalBlocks: [],
      privacyNotice: temporaryPrivacyNotices.contact.tr,
    },
  },
  {
    routeKey: "contact",
    locale: "en",
    slug: "contact",
    title: "Contact",
    seoTitle: "Contact",
    seoDescription: "Ardaş Yedek Parça contact form.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Corporate contact", heading: "Connect with the right team.", body: ["Send your corporate request to the relevant team through the secure contact form."] },
      sections: {},
      legalBlocks: [],
      privacyNotice: temporaryPrivacyNotices.contact.en,
    },
  },
  {
    routeKey: "career-apply",
    locale: "tr",
    slug: "kariyer/basvuru",
    title: "Genel Başvuru",
    seoTitle: "Genel İş Başvurusu",
    seoDescription: "Ardaş Yedek Parça genel iş başvuru formu.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Kariyer · Genel başvuru", heading: "Bir sonraki adımınızı bizimle paylaşın.", body: ["Başvuru bilgileri ve CV, güvenli ve yetki kontrollü işe alım sürecinde değerlendirilir."] },
      sections: {},
      legalBlocks: [],
      privacyNotice: temporaryPrivacyNotices.career.tr,
    },
  },
  {
    routeKey: "career-apply",
    locale: "en",
    slug: "careers/apply",
    title: "General Application",
    seoTitle: "General Job Application",
    seoDescription: "Ardaş Yedek Parça general job application form.",
    allowIndexing: false,
    content: {
      schemaVersion: 1,
      hero: { eyebrow: "Careers · General application", heading: "Share your next step with us.", body: ["Application details and CVs are evaluated within a secure, access-controlled recruitment process."] },
      sections: {},
      legalBlocks: [],
      privacyNotice: temporaryPrivacyNotices.career.en,
    },
  },
] as const satisfies readonly TemporaryCmsSeedPage[];

export const temporaryLegalSeedPages = legalPages;
export const temporaryCmsSeedPages = [...legalPages, ...formNoticePages] as const;

export function getTemporaryLegalSeedPage(
  routeKey: "privacy" | "cookies" | "data-protection",
  locale: Locale,
) {
  return legalPages.find(
    (page) => page.routeKey === routeKey && page.locale === locale,
  )!;
}
