type SeedNetwork = {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number;
};

type SeedProfile = {
  id: string;
  label: string;
  userDataDir: string;
  proxyUrl?: string;
};

const networks: SeedNetwork[] = [
  { id: "sepolia", name: "Sepolia", rpcUrl: "https://rpc.sepolia.example", chainId: 11155111 },
  { id: "holesky", name: "Holesky", rpcUrl: "https://rpc.holesky.example", chainId: 17000 }
];

const profiles: SeedProfile[] = [
  { id: "profile-1", label: "Profile 1", userDataDir: "/tmp/pw-auto/profile-1" },
  { id: "profile-2", label: "Profile 2", userDataDir: "/tmp/pw-auto/profile-2" }
];

const now = new Date().toISOString();

const sql = [
  "BEGIN TRANSACTION;",
  ...networks.map(
    (network) =>
      `INSERT INTO networks (id, name, rpc_url, chain_id, is_active, created_at, updated_at) VALUES ('${network.id}', '${network.name}', '${network.rpcUrl}', ${network.chainId}, 1, '${now}', '${now}');`
  ),
  ...profiles.map(
    (profile) =>
      `INSERT INTO browser_profiles (id, label, user_data_dir, proxy_url, created_at, updated_at) VALUES ('${profile.id}', '${profile.label}', '${profile.userDataDir}', ${profile.proxyUrl ? `'${profile.proxyUrl}'` : "NULL"}, '${now}', '${now}');`
  ),
  "COMMIT;"
];

for (const line of sql) {
  console.log(line);
}
