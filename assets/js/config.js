window.SITE_CONFIG = {
  nick: "insajd",

  // tylko A-Z 0-9 i - _ . ! ? @ # &, max ~10 znakow
  asciiName: "INSAJD",

  fullName: "insajd",

  // "auto" / "pl" / "en"
  defaultLang: "auto",

  title: {
    pl: "insajd | student, pentesting & purple team",
    en: "insajd | student, pentesting & purple team",
  },

  status: {
    available: true,
    text: { pl: "otwarty na nowe projekty", en: "open to new opportunities" },
  },

  roles: {
    pl: ["Student", "Purple Team", "Red Team", "Maldev", "Sieci komputerowe"],
    en: ["Student", "Purple Team", "Red Team", "Maldev", "Networking"],
  },

  tagline: {
    pl: "Młody student zafascynowany pentestingiem. Purple team z mocniejszym akcentem na red team, maldev i sieci komputerowe.",
    en: "A young student fascinated by penetration testing. Purple team with a stronger lean towards red team, maldev and computer networks.",
  },

  // np. "cv.pdf", null = bez przycisku
  cv: null,

  about: {
    paragraphs: {
      pl: [
        "Cześć! Jestem <strong>insajd</strong>, student zafascynowany pentestingiem. Najbliżej mi do <strong>purple teamu</strong>, z mocniejszym akcentem na stronę red teamu i maldev.",
        "W wolnym czasie uczę się, powoli wspinając się po tabeli <strong>Hack The Box</strong>. Oglądam też dużo CTF-ów i czerpię z nich wiedzę.",
        "Dobrze znam się na sieciach komputerowych. Technologie sieciowe i to, jak zbudowana jest sieć, fascynują mnie od dawna.",
      ],
      en: [
        "Hi! I'm <strong>insajd</strong>, a student fascinated by penetration testing. I'm closest to <strong>purple team</strong>, with a stronger lean towards the red team side and maldev.",
        "In my free time I study and slowly climb the <strong>Hack The Box</strong> leaderboard. I also watch a lot of CTFs and learn from them.",
        "I know computer networks well. Networking technologies and how networks are structured have fascinated me for a long time.",
      ],
    },

    facts: [
      { key: "name",     value: "insajd" },
      { key: "role",     value: { pl: "Student, purple team", en: "Student, purple team" } },
      { key: "location", value: { pl: "Polska", en: "Poland" } },
      { key: "focus",    value: ["red-team", "maldev", "network"] },
      { key: "languages",value: { pl: ["polski", "angielski"], en: ["Polish", "English"] } },
      { key: "status",   value: { pl: "otwarty na nowe projekty", en: "open to new opportunities" } },
    ],

    stats: [],
  },

  // level 0-100
  skills: [
    {
      group: { pl: "ofensywa", en: "offensive" },
      items: [
        { name: { pl: "Pentest sieci",         en: "Network pentesting" }, level: 80 },
        { name: "Privilege escalation",                                    level: 80 },
        { name: { pl: "Pentest aplikacji web", en: "Web app pentesting" }, level: 60 },
        { name: "Active Directory",                                        level: 60 },
      ],
    },
    {
      group: { pl: "programowanie", en: "programming" },
      items: [
        { name: "Python",     level: 80 },
        { name: "Bash",       level: 80 },
        { name: "PowerShell", level: 80 },
      ],
    },
    {
      group: { pl: "systemy", en: "systems" },
      items: [
        { name: "Linux",                              level: 80 },
        { name: "Windows",                            level: 80 },
        { name: { pl: "Sieci / TCP-IP", en: "Networking / TCP-IP" }, level: 80 },
        { name: "Docker",                             level: 80 },
      ],
    },
  ],

  tools: [
    "Burp Suite", "nmap", "Metasploit", "BloodHound", "impacket", "Wireshark",
    "ffuf", "sqlmap", "hashcat", "Nuclei", "Ghidra", "Kali Linux",
  ],

  // pusta lista = "wkrotce"
  projects: [],

  moreProjects: null,

  contact: [
    { label: "mail", value: "whats1nsxde@gmail.com", href: "mailto:whats1nsxde@gmail.com", copy: true },
  ],
};
