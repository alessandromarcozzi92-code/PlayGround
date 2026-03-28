export const trips = [
  {
    id: "giappone",
    name: "Giappone",
    date: "2024-04",
    color: "#E63946",
    cover: "https://picsum.photos/seed/japan-cover/800/600",
    heroImage: "https://picsum.photos/seed/japan-hero/1920/1080",
    description: "Tokyo, Kyoto e il Monte Fuji",
    tags: ["asia", "cultura", "citta"],
    published: true,
    sections: [
      {
        type: "text-image",
        title: "Tokyo by night",
        text: "La capitale giapponese si trasforma dopo il tramonto. Le luci al neon di Shinjuku e Shibuya creano un paesaggio urbano che sembra uscito da un film cyberpunk. Tra i vicoli stretti del Golden Gai, piccoli bar da cinque posti offrono sake e conversazione.",
        media: { type: "image", src: "https://picsum.photos/seed/japan-section-1/1200/800", caption: "Shinjuku Golden Gai" }
      },
      {
        type: "image-text",
        title: "I templi di Kyoto",
        text: "L'antica capitale imperiale conserva oltre duemila templi e santuari. Il Fushimi Inari, con i suoi diecimila torii rossi che si snodano sulla montagna, e' forse il piu iconico. Al tramonto, quando i turisti se ne vanno, il silenzio tra i torii e' quasi mistico.",
        media: { type: "image", src: "https://picsum.photos/seed/japan-section-2/1200/800", caption: "Fushimi Inari al tramonto" }
      }
    ],
    pois: [
      { lat: 34.9671, lng: 135.7727, name: "Fushimi Inari", icon: "temple", note: "Santuario con 10.000 torii rossi" },
      { lat: 35.6762, lng: 139.6503, name: "Shibuya Crossing", icon: "city", note: "L'incrocio piu famoso del mondo" },
      { lat: 35.3606, lng: 138.7274, name: "Monte Fuji", icon: "nature", note: "Il vulcano sacro, 3776m" },
      { lat: 35.0116, lng: 135.7681, name: "Kinkaku-ji", icon: "temple", note: "Il Padiglione d'Oro" }
    ],
    photos: [
      { src: "https://picsum.photos/seed/japan-1/1200/800", caption: "Tempio di Fushimi Inari" },
      { src: "https://picsum.photos/seed/japan-2/1200/800", caption: "Shibuya crossing" },
      { src: "https://picsum.photos/seed/japan-3/1200/800", caption: "Monte Fuji al tramonto" },
      { src: "https://picsum.photos/seed/japan-4/1200/800", caption: "Giardino zen a Kyoto" },
      { src: "https://picsum.photos/seed/japan-5/1200/800", caption: "Street food a Osaka" },
    ]
  },
  {
    id: "islanda",
    name: "Islanda",
    date: "2024-08",
    color: "#457B9D",
    cover: "https://picsum.photos/seed/iceland-cover/800/600",
    heroImage: "https://picsum.photos/seed/iceland-hero/1920/1080",
    description: "Aurora boreale, ghiacciai e cascate",
    tags: ["europa", "natura", "avventura"],
    published: true,
    sections: [
      {
        type: "text-image",
        title: "La terra del ghiaccio",
        text: "L'Islanda e' un mondo a parte. Tra ghiacciai millenari e vulcani attivi, il paesaggio cambia ogni chilometro. La laguna glaciale di Jokulsarlon, con i suoi iceberg azzurri che galleggiano verso il mare, e' uno spettacolo che toglie il fiato.",
        media: { type: "image", src: "https://picsum.photos/seed/iceland-section-1/1200/800", caption: "Laguna glaciale Jokulsarlon" }
      },
      {
        type: "image-text",
        title: "Aurora boreale",
        text: "Aspettare l'aurora boreale e' un esercizio di pazienza. Si esce nel buio gelido, si punta lo sguardo al cielo e si aspetta. Quando arriva, il cielo si incendia di verde e viola, e tutto il freddo viene dimenticato in un istante.",
        media: { type: "image", src: "https://picsum.photos/seed/iceland-section-2/1200/800", caption: "Aurora boreale a Vik" }
      }
    ],
    pois: [
      { lat: 63.6167, lng: -19.9908, name: "Skogafoss", icon: "nature", note: "Cascata alta 60 metri" },
      { lat: 64.0482, lng: -16.1780, name: "Jokulsarlon", icon: "nature", note: "Laguna glaciale con iceberg" },
      { lat: 63.4041, lng: -19.0560, name: "Reynisfjara", icon: "nature", note: "Spiaggia di sabbia nera" },
      { lat: 63.5269, lng: -19.5111, name: "Vik", icon: "city", note: "Il villaggio piu meridionale" }
    ],
    photos: [
      { src: "https://picsum.photos/seed/iceland-1/1200/800", caption: "Aurora boreale a Vik" },
      { src: "https://picsum.photos/seed/iceland-2/1200/800", caption: "Cascata Skogafoss" },
      { src: "https://picsum.photos/seed/iceland-3/1200/800", caption: "Laguna glaciale Jokulsarlon" },
      { src: "https://picsum.photos/seed/iceland-4/1200/800", caption: "Spiaggia nera di Reynisfjara" },
    ]
  },
  {
    id: "marocco",
    name: "Marocco",
    date: "2025-01",
    color: "#E9C46A",
    cover: "https://picsum.photos/seed/morocco-cover/800/600",
    heroImage: "https://picsum.photos/seed/morocco-hero/1920/1080",
    description: "Marrakech, deserto del Sahara e l'Atlante",
    tags: ["africa", "cultura", "avventura"],
    published: true,
    sections: [
      {
        type: "text-image",
        title: "I colori di Marrakech",
        text: "Marrakech e' un assalto ai sensi. I souk traboccano di spezie, tessuti e ceramiche colorate. Piazza Jemaa el-Fna si anima al tramonto con musicisti, cantastorie e bancarelle di cibo. Il profumo di menta e tagine riempie l'aria.",
        media: { type: "image", src: "https://picsum.photos/seed/morocco-section-1/1200/800", caption: "Souk di Marrakech" }
      },
      {
        type: "image-text",
        title: "Notti nel Sahara",
        text: "Dormire nel deserto sotto un cielo stellato e' un'esperienza che cambia la prospettiva. Le dune dell'Erg Chebbi, alte fino a 150 metri, si tingono di arancione e rosso al tramonto. Il silenzio del deserto e' assordante, rotto solo dal vento sulla sabbia.",
        media: { type: "image", src: "https://picsum.photos/seed/morocco-section-2/1200/800", caption: "Tramonto sulle dune" }
      }
    ],
    pois: [
      { lat: 31.6295, lng: -7.9811, name: "Jemaa el-Fna", icon: "city", note: "La piazza cuore di Marrakech" },
      { lat: 31.2092, lng: -3.9931, name: "Erg Chebbi", icon: "nature", note: "Dune del Sahara fino a 150m" },
      { lat: 31.7117, lng: -7.9856, name: "Jardin Majorelle", icon: "nature", note: "Giardino botanico di Yves Saint Laurent" },
      { lat: 31.5159, lng: -6.5000, name: "Ait Benhaddou", icon: "temple", note: "Kasbah patrimonio UNESCO" }
    ],
    photos: [
      { src: "https://picsum.photos/seed/morocco-1/1200/800", caption: "Piazza Jemaa el-Fna" },
      { src: "https://picsum.photos/seed/morocco-2/1200/800", caption: "Dune dell'Erg Chebbi" },
      { src: "https://picsum.photos/seed/morocco-3/1200/800", caption: "Riad a Marrakech" },
      { src: "https://picsum.photos/seed/morocco-4/1200/800", caption: "Villaggio berbero sull'Atlante" },
      { src: "https://picsum.photos/seed/morocco-5/1200/800", caption: "Souk delle spezie" },
      { src: "https://picsum.photos/seed/morocco-6/1200/800", caption: "Tramonto nel deserto" },
    ]
  }
];
