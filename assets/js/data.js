export const templateLibrary = [
  {
    id: "atlas",
    name: "Atlas Hero",
    eyebrow: "Cinematic",
    description: "Hero layout đậm, nổi bật link chính và phần giới thiệu như landing page cá nhân.",
    className: "atlas"
  },
  {
    id: "monograph",
    name: "Monograph Light",
    eyebrow: "Editorial",
    description: "Sạch, sáng, tập trung vào chữ và phù hợp creator, consultant, freelancer.",
    className: "monograph"
  },
  {
    id: "nova",
    name: "Nova Night",
    eyebrow: "Immersive",
    description: "Tông tối, chiều sâu cao, hợp với streamer, gamer, dev portfolio.",
    className: "nova"
  },
  {
    id: "portal",
    name: "Portal Split",
    eyebrow: "Gallery",
    description: "Cảm giác showroom, chia khối rõ, hợp với personal brand và bio dạng danh thiếp số.",
    className: "portal"
  }
];

export const paletteLibrary = [
  {
    id: "meta-blue",
    name: "Meta Blue",
    accent: "#0064E0",
    accentSoft: "#E8F3FF",
    surface: "#F1F4F7",
    contrast: "#1C2B33"
  },
  {
    id: "ray-red",
    name: "Ray Red",
    accent: "#D6311F",
    accentSoft: "#FFF0EE",
    surface: "#F2F0E6",
    contrast: "#2A211D"
  },
  {
    id: "quest-purple",
    name: "Quest Purple",
    accent: "#A121CE",
    accentSoft: "#F4E8FA",
    surface: "#181A1B",
    contrast: "#FFFFFF"
  },
  {
    id: "portal-teal",
    name: "Portal Teal",
    accent: "#1B365D",
    accentSoft: "#C8E4E8",
    surface: "#EFF7F8",
    contrast: "#1B365D"
  },
  {
    id: "work-indigo",
    name: "Work Indigo",
    accent: "#6441D2",
    accentSoft: "#EFEAFF",
    surface: "#F7F8FA",
    contrast: "#1C2B33"
  },
  {
    id: "seafoam",
    name: "Seafoam",
    accent: "#2ABBA7",
    accentSoft: "#E7FAF6",
    surface: "#F7FFFE",
    contrast: "#163E42"
  }
];

export const linkIconOptions = [
  { value: "bx-link-alt", label: "Website" },
  { value: "bxl-instagram", label: "Instagram" },
  { value: "bxl-tiktok", label: "TikTok" },
  { value: "bxl-facebook-circle", label: "Facebook" },
  { value: "bxl-youtube", label: "YouTube" },
  { value: "bxl-github", label: "GitHub" },
  { value: "bxl-linkedin-square", label: "LinkedIn" },
  { value: "bx-envelope", label: "Email" },
  { value: "bx-store-alt", label: "Shop" }
];

export const defaultBio = {
  username: "",
  displayName: "",
  headline: "Creator, builder, and storyteller.",
  about: "Viết ngắn gọn bạn là ai, đang làm gì, và nơi tốt nhất để mọi người kết nối với bạn.",
  location: "Bangkok, Thailand",
  templateId: "atlas",
  paletteId: "meta-blue",
  buttons: [
    { label: "Portfolio", url: "https://example.com", icon: "bx-link-alt" },
    { label: "Instagram", url: "https://instagram.com/", icon: "bxl-instagram" }
  ],
  visibility: "public"
};
