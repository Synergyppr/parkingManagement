export interface PropertyConfig {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

const PROPERTIES: PropertyConfig[] = [
  {
    id: "a7e348d3-8dfb-4f71-8bc5-042ba75d53c7",
    slug: "250",
    name: "250 Plaza",
    latitude: 18.42640364505519,
    longitude: -66.05949394407354,
    radius: 135,
  },
  {
    id: "b2aa6b8f-29b2-4fc3-a040-09af828d1a8d",
    slug: "270",
    name: "270 Plaza",
    latitude: 18.424045812447083,
    longitude: -66.05853179607325,
    radius: 100,
  },
  {
    id: "5acdd1ec-392d-4d28-80e6-8adbd08e09cd",
    slug: "coc",
    name: "Condado Ocean Club",
    latitude: 18.45925391049937,
    longitude: -66.07727984429157,
    radius: 80,
  },
  {
    id: "f82ce385-c8e4-4c09-8b08-b01bf9676dc7",
    slug: "cvh",
    name: "Condado Vanderbilt",
    latitude: 18.458770636752906,
    longitude: -66.0760822589064,
    radius: 65,
  },
  {
    id: "22fbcd09-8ab6-4a27-0d8a-08ddc9e5526e",
    slug: "lcr",
    name: "La Concha Resort",
    latitude: 18.457076,
    longitude: -66.074115,
    radius: 130,
  },
  {
    id: "5e709c49-90b1-44b1-a482-4fce3a2290d9",
    slug: "tvr",
    name: "Vanderbilt Residences",
    latitude: 18.45654608834076,
    longitude: -66.0721758106715,
    radius: 130,
  },
  {
    id: "b12c31dc-acce-40b2-afa9-b646ed1ffee9",
    slug: "bbr",
    name: "Bahia Beach Resort & Golf Club",
    latitude: 18.410806817287984,
    longitude: -65.82592804620468,
    radius: 130,
  },
];

const USERNAME_PREFIX_MAP: Record<string, string> = {
  "250": "250",
  "270": "270",
  coc: "coc",
  cvh: "cvh",
  lcr: "lcr",
  tvr: "tvr",
  bbr: "bbr",
};

export function resolvePropertyByUsername(
  username: string
): PropertyConfig | null {
  const lower = username.toLowerCase();
  for (const [prefix, slug] of Object.entries(USERNAME_PREFIX_MAP)) {
    if (lower.startsWith(prefix)) {
      return PROPERTIES.find((p) => p.slug === slug) || null;
    }
  }
  return null;
}

export function getPropertyById(
  propertyId: string
): PropertyConfig | null {
  return PROPERTIES.find((p) => p.id === propertyId) || null;
}
