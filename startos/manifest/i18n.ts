// short and long are authored in en_US; the other locales are careful
// translations of that text. They describe which chain the node follows and
// what its consensus rules are, so a change to the English must be carried
// into every locale in the same commit, and a reported mistranslation fixed
// as a bug. torDescription below is upstream's.
const shortEn =
  "Bitcoin Knots for the SHA256 chain: a Bitcoin full node with Knots' policy controls, consensus-identical to Bitcoin Core"

const longEn =
  "Bitcoin Knots SHA256 is Bitcoin Knots' patch series maintained on top of Bitcoin Core for the SHA256 chain, the chain Bitcoin Core follows. Consensus is never modified: this node accepts exactly the blocks Bitcoin Core accepts. What it adds is what Knots always added, the larger set of relay and mining policy controls (OP_RETURN limits, parasite and token filters, replacement rules, bare multisig and dust settings) with Knots' defaults. It does not carry BIP-110 (RDTS) or the BLAKE2b proof-of-work change that Bitcoin Knots adopted after 29.3; if you want those, install Bitcoin Knots (RDTS), which follows a different chain. This is a flavor of the bitcoind package: switch to it from Bitcoin Core or Bitcoin Knots (pre-RDTS) and keep your synced chain, and services that accept Bitcoin Core accept it. Releases are built from the public source repository and signed by the maintainer; the package verifies that signature before it installs a binary. Like the other bitcoind flavors it runs an embedded I2P router beside the node and an RPC proxy in front of it that, when the node is pruned, fetches missing blocks from peers."

export const short = {
  en_US: shortEn,
  es_ES:
    'Bitcoin Knots para la cadena SHA256: un nodo completo de Bitcoin con los controles de política de Knots, con un consenso idéntico al de Bitcoin Core',
  de_DE:
    'Bitcoin Knots für die SHA256-Chain: ein Bitcoin-Full-Node mit den Richtlinien-Einstellungen von Knots, im Konsens identisch mit Bitcoin Core',
  pl_PL:
    'Bitcoin Knots dla łańcucha SHA256: pełny węzeł Bitcoin z ustawieniami zasad Knots, o konsensusie identycznym z Bitcoin Core',
  fr_FR:
    'Bitcoin Knots pour la chaîne SHA256 : un nœud Bitcoin complet avec les réglages de politique de Knots, au consensus identique à celui de Bitcoin Core',
}

export const long = {
  en_US: longEn,
  es_ES:
    'Bitcoin Knots SHA256 es la serie de parches de Bitcoin Knots mantenida sobre Bitcoin Core para la cadena SHA256, la cadena que sigue Bitcoin Core. El consenso nunca se modifica: este nodo acepta exactamente los bloques que acepta Bitcoin Core. Lo que añade es lo que Knots siempre añadió: el conjunto más amplio de controles de política de retransmisión y minado (límites de OP_RETURN, filtros de parásitos y tokens, reglas de reemplazo, ajustes de multifirma desnuda y de polvo) con los valores predeterminados de Knots. No incluye BIP-110 (RDTS) ni el cambio de prueba de trabajo BLAKE2b que Bitcoin Knots adoptó después de 29.3; si quiere esos cambios, instale Bitcoin Knots (RDTS), que sigue una cadena diferente. Es una variante del paquete bitcoind: cambie a ella desde Bitcoin Core o Bitcoin Knots (pre-RDTS) y conserve su cadena sincronizada; los servicios que aceptan Bitcoin Core también la aceptan. Las versiones se compilan desde el repositorio público de código fuente y las firma el mantenedor; el paquete verifica esa firma antes de instalar un binario. Como las demás variantes de bitcoind, ejecuta un enrutador I2P integrado junto al nodo y, delante de él, un proxy RPC que, cuando el nodo está podado, obtiene de los pares los bloques que faltan.',
  de_DE:
    'Bitcoin Knots SHA256 ist die Patch-Reihe von Bitcoin Knots, gepflegt auf Basis von Bitcoin Core für die SHA256-Chain, der Chain, der Bitcoin Core folgt. Der Konsens wird nie verändert: Dieser Knoten akzeptiert genau die Blöcke, die Bitcoin Core akzeptiert. Hinzu kommt, was Knots schon immer hinzugefügt hat: die größere Auswahl an Richtlinien für Weiterleitung und Mining (OP_RETURN-Grenzen, Parasiten- und Token-Filter, Ersetzungsregeln, Einstellungen für Bare-Multisig und Dust) mit den Standardwerten von Knots. Nicht enthalten sind BIP-110 (RDTS) und die BLAKE2b-Proof-of-Work-Änderung, die Bitcoin Knots nach 29.3 übernommen hat; wenn Sie diese möchten, installieren Sie Bitcoin Knots (RDTS), das einer anderen Chain folgt. Dies ist eine Variante des bitcoind-Pakets: Wechseln Sie von Bitcoin Core oder Bitcoin Knots (pre-RDTS) dazu und behalten Sie Ihre synchronisierte Chain; Dienste, die Bitcoin Core akzeptieren, akzeptieren auch diesen Knoten. Die Versionen werden aus dem öffentlichen Quellcode-Repository gebaut und vom Maintainer signiert; das Paket prüft diese Signatur, bevor es ein Binärprogramm installiert. Wie die anderen bitcoind-Varianten betreibt es neben dem Knoten einen eingebetteten I2P-Router und davor einen RPC-Proxy, der bei einem gekürzten (pruned) Knoten fehlende Blöcke von Peers abruft.',
  pl_PL:
    'Bitcoin Knots SHA256 to seria poprawek Bitcoin Knots utrzymywana na bazie Bitcoin Core dla łańcucha SHA256, czyli łańcucha, za którym podąża Bitcoin Core. Konsensus nigdy nie jest zmieniany: ten węzeł akceptuje dokładnie te bloki, które akceptuje Bitcoin Core. Dodaje to, co Knots dodawał zawsze: szerszy zestaw ustawień zasad przekazywania i kopania (limity OP_RETURN, filtry pasożytów i tokenów, reguły zastępowania, ustawienia gołego multisig i pyłu) z domyślnymi wartościami Knots. Nie zawiera BIP-110 (RDTS) ani zmiany dowodu pracy na BLAKE2b, którą Bitcoin Knots przyjął po wersji 29.3; jeśli ich chcesz, zainstaluj Bitcoin Knots (RDTS), który podąża za innym łańcuchem. To wariant pakietu bitcoind: przełącz się na niego z Bitcoin Core lub Bitcoin Knots (pre-RDTS) i zachowaj zsynchronizowany łańcuch; usługi, które akceptują Bitcoin Core, akceptują również ten węzeł. Wydania są budowane z publicznego repozytorium kodu źródłowego i podpisywane przez opiekuna; pakiet weryfikuje ten podpis przed zainstalowaniem pliku binarnego. Podobnie jak inne warianty bitcoind uruchamia obok węzła wbudowany router I2P, a przed nim proxy RPC, które, gdy węzeł jest przycięty, pobiera brakujące bloki od peerów.',
  fr_FR:
    "Bitcoin Knots SHA256 est la série de correctifs de Bitcoin Knots maintenue sur Bitcoin Core pour la chaîne SHA256, la chaîne que suit Bitcoin Core. Le consensus n'est jamais modifié : ce nœud accepte exactement les blocs qu'accepte Bitcoin Core. Ce qu'il ajoute, c'est ce que Knots a toujours ajouté : l'ensemble plus large de réglages de politique de relais et de minage (limites OP_RETURN, filtres de parasites et de jetons, règles de remplacement, réglages de multisig nu et de poussière) avec les valeurs par défaut de Knots. Il n'inclut ni BIP-110 (RDTS) ni le changement de preuve de travail BLAKE2b que Bitcoin Knots a adoptés après la 29.3 ; si vous les voulez, installez Bitcoin Knots (RDTS), qui suit une autre chaîne. C'est une variante du paquet bitcoind : passez-y depuis Bitcoin Core ou Bitcoin Knots (pre-RDTS) en conservant votre chaîne synchronisée ; les services qui acceptent Bitcoin Core l'acceptent aussi. Les versions sont construites à partir du dépôt public de code source et signées par le mainteneur ; le paquet vérifie cette signature avant d'installer un binaire. Comme les autres variantes de bitcoind, il fait tourner un routeur I2P intégré à côté du nœud et, devant lui, un proxy RPC qui, lorsque le nœud est élagué, récupère auprès des pairs les blocs manquants.",
}

export const torDescription = {
  en_US:
    'Required for .onion peer connectivity, onlynet=onion, or when a Tor address is requested.',
  es_ES:
    'Requerido para conectividad de pares .onion, onlynet=onion, o cuando se solicita una dirección Tor.',
  de_DE:
    'Erforderlich für .onion Peer-Konnektivität, onlynet=onion oder wenn eine Tor-Adresse angefordert wird.',
  pl_PL:
    'Wymagany dla połączeń .onion z peerami, onlynet=onion lub gdy żądany jest adres Tor.',
  fr_FR:
    "Requis pour la connectivité .onion entre pairs, onlynet=onion, ou lorsqu'une adresse Tor est demandée.",
}
