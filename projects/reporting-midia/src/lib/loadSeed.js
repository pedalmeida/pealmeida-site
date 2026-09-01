export async function loadSeed() {
  const url = `${import.meta.env.BASE_URL}seed.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Não foi possível ler o seed (${res.status})`);
  }
  return res.json();
}
