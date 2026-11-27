import type { GlossaryEntry } from "../types/progress";

export const HCIA_GLOSSARY: GlossaryEntry[] = [
  {
    term: "ARPANET",
    fullName: "Advanced Research Projects Agency Network",
    category: "History & Internet",
    definition: "The 1969 predecessor of the modern Internet that pioneered packet-switched networking and adopted TCP/IP.",
    definitionPt: "Predecessora da Internet moderna criada em 1969, pioneira em packet-switched networking e na adoção do TCP/IP."
  },
  {
    term: "TCP/IP",
    fullName: "Transmission Control Protocol / Internet Protocol",
    category: "Reference Models",
    definition: "The mainstream protocol suite of the Internet, organizing network communication into layered protocols.",
    definitionPt: "Conjunto principal de protocolos da Internet, organizando a comunicação de rede em camadas."
  },
  {
    term: "OSI",
    fullName: "Open Systems Interconnection",
    category: "Reference Models",
    definition: "ISO's theoretical 7-layer reference model (Application, Presentation, Session, Transport, Network, Data Link, Physical).",
    definitionPt: "Modelo teórico de referência em 7 camadas da ISO (Application, Presentation, Session, Transport, Network, Data Link e Physical)."
  },
  {
    term: "OSI-RM",
    fullName: "OSI Reference Model",
    category: "Reference Models",
    definition: "Formal name for ISO/IEC 7498-1, the 7-layer networking framework proposed by ISO in the 1980s.",
    definitionPt: "Nome formal da norma ISO/IEC 7498-1, o modelo de rede em 7 camadas proposto pela ISO nos anos 1980."
  },
  {
    term: "LAN",
    fullName: "Local Area Network",
    category: "Network Types",
    definition: "A network covering a small geographical area (a home, office building, or campus, typically within a few kilometers) using Ethernet or Wi-Fi.",
    definitionPt: "Rede local que cobre uma área geográfica pequena (casa, escritório ou campus, geralmente até alguns quilômetros) usando Ethernet ou Wi-Fi."
  },
  {
    term: "MAN",
    fullName: "Metropolitan Area Network",
    category: "Network Types",
    definition: "A large-scale network interconnecting hosts, databases, and LANs across a university campus or an entire city.",
    definitionPt: "Rede metropolitana de grande porte que interconecta hosts, bancos de dados e LANs em um campus universitário ou cidade inteira."
  },
  {
    term: "WAN",
    fullName: "Wide Area Network",
    category: "Network Types",
    definition: "A long-distance network spanning tens to thousands of kilometers to connect distant LANs/MANs using PPP, MPLS, or SRv6.",
    definitionPt: "Rede de longa distância que abrange de dezenas a milhares de quilômetros conectando LANs/MANs distantes usando PPP, MPLS ou SRv6."
  },
  {
    term: "WLAN",
    fullName: "Wireless Local Area Network",
    category: "Wireless",
    definition: "A local network that uses wireless signals (typically IEEE 802.11 Wi-Fi) instead of cables to connect terminals.",
    definitionPt: "Rede local sem fio que usa sinais wireless (normalmente Wi-Fi IEEE 802.11) em vez de cabos para conectar terminais."
  },
  {
    term: "Switch",
    category: "Network Devices",
    definition: "A core Layer 2 LAN device that forwards Ethernet frames efficiently by looking up destination MAC addresses in its MAC address table.",
    definitionPt: "Dispositivo central de Layer 2 em uma LAN que encaminha Ethernet frames consultando o MAC address de destino na sua MAC address table."
  },
  {
    term: "Router",
    category: "Network Devices",
    definition: "A Layer 3 device that selects optimal paths across networks based on destination IP addresses and its routing table.",
    definitionPt: "Dispositivo de Layer 3 que seleciona o melhor caminho entre redes com base no IP address de destino e na sua routing table."
  },
  {
    term: "Firewall",
    category: "Security",
    definition: "A security device deployed at network boundaries/egress to isolate security zones, filter traffic, and provide VPN/NAT services.",
    definitionPt: "Dispositivo de segurança implantado na borda (egress) da rede para isolar zonas de segurança, filtrar tráfego e fornecer VPN/NAT."
  },
  {
    term: "WAC",
    fullName: "Wireless Access Controller",
    category: "Wireless",
    definition: "A centralized enterprise device at the core or aggregation layer that manages and configures Fit APs in a unified manner.",
    definitionPt: "Controlador corporativo centralizado nas camadas core ou aggregation que gerencia e configura Fit APs de forma unificada."
  },
  {
    term: "AP",
    fullName: "Access Point",
    category: "Wireless",
    definition: "A wireless access device bridging Wi-Fi terminals to the wired network; supports Fat, Fit, or Cloud operating modes.",
    definitionPt: "Ponto de acesso wireless que conecta terminais Wi-Fi à rede cabeada; suporta os modos Fat AP, Fit AP ou Cloud AP."
  },
  {
    term: "Fat AP",
    category: "Wireless",
    definition: "A standalone AP configured individually for basic functions—cost-effective and suited for home use.",
    definitionPt: "AP autônomo configurado individualmente para funções básicas — econômico e indicado para uso doméstico."
  },
  {
    term: "Fit AP",
    category: "Wireless",
    definition: "An enterprise AP managed centrally by a WAC, ideal for midsize and large campus WLANs.",
    definitionPt: "AP corporativo gerenciado de forma centralizada por um WAC, ideal para redes WLAN de médias e grandes empresas."
  },
  {
    term: "Cloud AP",
    category: "Wireless",
    definition: "A plug-and-play AP managed via a cloud management platform, ideal for small and midsize enterprises.",
    definitionPt: "AP plug-and-play gerenciado por uma plataforma em nuvem, ideal para pequenas e médias empresas."
  },
  {
    term: "VRP",
    fullName: "Versatile Routing Platform",
    category: "Huawei OS",
    definition: "Huawei's general network operating system running across routers, switches, and firewalls with a unified CLI.",
    definitionPt: "Sistema operacional de rede da Huawei presente em routers, switches e firewalls com uma CLI unificada."
  },
  {
    term: "CLI",
    fullName: "Command-Line Interface",
    category: "Huawei OS",
    definition: "Text-based interface for configuring, querying, and maintaining Huawei network devices across hierarchical command views.",
    definitionPt: "Interface de linha de comando para configurar, consultar e manter dispositivos Huawei usando command views hierárquicas."
  },
  {
    term: "IETF",
    fullName: "Internet Engineering Task Force",
    category: "Standards",
    definition: "The voluntary standards body responsible for developing TCP/IP Internet protocols and publishing RFC specifications.",
    definitionPt: "Organização voluntária responsável por desenvolver os protocolos TCP/IP da Internet e publicar padrões via RFCs."
  },
  {
    term: "IEEE",
    fullName: "Institute of Electrical and Electronics Engineers",
    category: "Standards",
    definition: "Standards organization behind ~30% of global electronics/CS standards, including IEEE 802.3 (Ethernet) and IEEE 802.11 (Wi-Fi).",
    definitionPt: "Organização responsável por ~30% dos padrões globais de eletrônica e computação, incluindo IEEE 802.3 (Ethernet) e IEEE 802.11 (Wi-Fi)."
  },
  {
    term: "ISO",
    fullName: "International Organization for Standardization",
    category: "Standards",
    definition: "International standards body that published the 7-layer OSI reference model (ISO/IEC 7498-1).",
    definitionPt: "Organização internacional de padronização que publicou o modelo de referência OSI de 7 camadas (ISO/IEC 7498-1)."
  },
  {
    term: "RFC",
    fullName: "Request for Comments",
    category: "Standards",
    definition: "Official technical documents published by the IETF defining Internet protocols and standards (e.g., RFC 791 for IP, RFC 793 for TCP).",
    definitionPt: "Documentos técnicos oficiais publicados pelo IETF definindo padrões da Internet (ex.: RFC 791 para IP, RFC 793 para TCP)."
  },
  {
    term: "IEC",
    fullName: "International Electrotechnical Commission",
    category: "Standards",
    definition: "International standards organization specializing in electrical and electronic engineering standards.",
    definitionPt: "Organização internacional não governamental especializada em padrões de engenharia elétrica e eletrônica."
  },
  {
    term: "HTTP",
    fullName: "Hypertext Transfer Protocol",
    category: "Application Layer",
    definition: "Client/server application-layer protocol using TCP port 80 to request and deliver web pages.",
    definitionPt: "Protocolo cliente/servidor da Application layer que usa TCP port 80 para requisitar e entregar páginas web."
  },
  {
    term: "FTP",
    fullName: "File Transfer Protocol",
    category: "Application Layer",
    definition: "Reliable file-transfer protocol running over TCP ports 20 (data) and 21 (control).",
    definitionPt: "Protocolo confiável de transferência de arquivos que opera sobre TCP ports 20 (dados) e 21 (controle)."
  },
  {
    term: "TFTP",
    fullName: "Trivial File Transfer Protocol",
    category: "Application Layer",
    definition: "Lightweight file-transfer protocol without complex authentication or session overhead.",
    definitionPt: "Alternativa simples ao FTP para transferências básicas de arquivos sem verificação ou interações complexas."
  },
  {
    term: "DNS",
    fullName: "Domain Name System",
    category: "Application Layer",
    definition: "Client/server service (primarily UDP port 53) that translates human-readable domain names like www.huawei.com into IP addresses.",
    definitionPt: "Serviço cliente/servidor (UDP port 53) que traduz domain names legíveis como www.huawei.com em IP addresses."
  },
  {
    term: "Telnet",
    category: "Application Layer",
    definition: "Remote terminal login protocol running on TCP port 23 to manage remote network devices.",
    definitionPt: "Protocolo de login remoto de terminal na TCP port 23 para gerenciar dispositivos de rede à distância."
  },
  {
    term: "SMTP",
    fullName: "Simple Mail Transfer Protocol",
    category: "Application Layer",
    definition: "Email transmission protocol operating over TCP port 25.",
    definitionPt: "Protocolo de envio de e-mails na Internet que opera sobre a TCP port 25."
  },
  {
    term: "SNMP",
    fullName: "Simple Network Management Protocol",
    category: "Application Layer",
    definition: "Protocol enabling network management systems (NMS) to monitor and configure network elements remotely.",
    definitionPt: "Protocolo que permite a sistemas de gerenciamento (NMS) monitorar e modificar informações de elementos de rede remotamente."
  },
  {
    term: "DHCP",
    fullName: "Dynamic Host Configuration Protocol",
    category: "Application Layer",
    definition: "Protocol that dynamically assigns IP addresses and network configuration parameters to hosts upon request.",
    definitionPt: "Protocolo que atribui automaticamente IP addresses e parâmetros de configuração de rede aos hosts sob demanda."
  },
  {
    term: "TCP",
    fullName: "Transmission Control Protocol",
    category: "Transport Layer",
    definition: "Connection-oriented, reliable transport protocol (RFC 793) ensuring no loss, no duplication, and in-order delivery.",
    definitionPt: "Protocolo de transporte orientado a conexão e confiável (RFC 793), garantindo entrega sem perdas, sem duplicação e em ordem."
  },
  {
    term: "UDP",
    fullName: "User Datagram Protocol",
    category: "Transport Layer",
    definition: "Connectionless, best-effort transport protocol (RFC 768) with ultra-low overhead and latency for video, gaming, and DNS.",
    definitionPt: "Protocolo de transporte sem conexão (connectionless, RFC 768) com baixíssimo overhead e latência para vídeo, jogos e DNS."
  },
  {
    term: "IP",
    fullName: "Internet Protocol",
    category: "Network Layer",
    definition: "Core connectionless network-layer protocol providing logical addressing and host-to-host packet forwarding across networks.",
    definitionPt: "Protocolo central da Network layer (connectionless) que fornece endereçamento lógico e encaminhamento de packets entre redes."
  },
  {
    term: "IPv4",
    fullName: "Internet Protocol version 4",
    category: "Network Layer",
    definition: "The dominant 32-bit network-layer addressing protocol written in dotted-decimal format (e.g., 192.168.1.1).",
    definitionPt: "Protocolo de endereçamento de 32 bits mais utilizado na Network layer, escrito em notação decimal pontuada (ex.: 192.168.1.1)."
  },
  {
    term: "IPv6",
    fullName: "Internet Protocol version 6",
    category: "Network Layer",
    definition: "Next-generation 128-bit IP protocol designed to overcome IPv4 address exhaustion and simplify routing.",
    definitionPt: "Protocolo IP de nova geração com 128 bits, projetado para superar o esgotamento de endereços IPv4 e simplificar o roteamento."
  },
  {
    term: "ICMP",
    fullName: "Internet Control Message Protocol",
    category: "Network Layer",
    definition: "Network-layer control and diagnostic protocol used by ping and tracert to report errors and test reachability.",
    definitionPt: "Protocolo de controle e diagnóstico da Network layer usado pelo ping e tracert para reportar falhas e testar conectividade."
  },
  {
    term: "IGMP",
    fullName: "Internet Group Management Protocol",
    category: "Network Layer",
    definition: "Protocol used between IP hosts and adjacent multicast routers to manage multicast group memberships.",
    definitionPt: "Protocolo usado entre hosts IP e multicast routers adjacentes para gerenciar a participação em grupos multicast."
  },
  {
    term: "ARP",
    fullName: "Address Resolution Protocol",
    category: "Network / Link",
    definition: "Resolves a known Layer 3 IPv4 address into its corresponding Layer 2 MAC address on a local network segment.",
    definitionPt: "Resolve um IPv4 address conhecido (Layer 3) no MAC address correspondente (Layer 2) dentro do mesmo segmento local."
  },
  {
    term: "Ethernet",
    category: "Data Link Layer",
    definition: "Standardized as IEEE 802.3, the dominant broadcast multi-access Layer 2 LAN technology using MAC addressing.",
    definitionPt: "Padronizada como IEEE 802.3, é a principal tecnologia Layer 2 de broadcast e multi-access em LANs usando endereçamento MAC."
  },
  {
    term: "PPP",
    fullName: "Point-to-Point Protocol",
    category: "Data Link Layer",
    definition: "Full-duplex WAN Layer 2 protocol supporting LCP parameter negotiation, CHAP/PAP authentication, and NCP/IPCP.",
    definitionPt: "Protocolo Layer 2 full-duplex para WANs com negociação LCP, autenticação CHAP/PAP e negociação NCP/IPCP."
  },
  {
    term: "PPPoE",
    fullName: "Point-to-Point Protocol over Ethernet",
    category: "Data Link Layer",
    definition: "Encapsulates PPP frames inside Ethernet frames, widely used in broadband dial-up access.",
    definitionPt: "Encapsula frames PPP dentro de Ethernet frames, muito usado em acesso banda larga residencial (dial-up broadband)."
  },
  {
    term: "MAC",
    fullName: "Medium Access Control",
    category: "Data Link Layer",
    definition: "48-bit (6-byte, 12-hex-digit) physical/hardware address burned into network interfaces (e.g., 48-A4-72-1C-8F-4F).",
    definitionPt: "Endereço físico/de hardware de 48 bits (6 bytes, 12 dígitos hexadecimais) gravado na placa de rede pelo fabricante (ex.: 48-A4-72-1C-8F-4F)."
  },
  {
    term: "CSMA/CD",
    fullName: "Carrier Sense Multiple Access / Collision Detection",
    category: "Data Link Layer",
    definition: "Early shared-media Ethernet mechanism enabling nodes to listen before transmitting and back off after collisions.",
    definitionPt: "Mecanismo clássico do Ethernet em meio compartilhado que escuta o canal antes de transmitir e trata colisões."
  },
  {
    term: "PDU",
    fullName: "Protocol Data Unit",
    category: "Reference Models",
    definition: "The data unit exchanged at a given layer: Data (App), Segment (Transport), Packet (Network), Frame (Data Link), Bitstream (Physical).",
    definitionPt: "Unidade de dados de cada camada: Data (Application), Segment (Transport), Packet (Network), Frame (Data Link) e Bitstream (Physical)."
  },
  {
    term: "FCS",
    fullName: "Frame Check Sequence",
    category: "Data Link Layer",
    definition: "Trailer appended at the end of an Ethernet frame to detect transmission bit errors.",
    definitionPt: "Trailer adicionado ao final do Ethernet frame para detectar erros de bits durante a transmissão."
  },
  {
    term: "Encapsulation",
    category: "Data Process",
    definition: "Wrapping upper-layer payload with a protocol header (and optional trailer) as data travels down the protocol stack.",
    definitionPt: "Processo de envolver o data payload com um header (e trailer opcional) conforme os dados descem pela pilha de protocolos."
  },
  {
    term: "Decapsulation",
    category: "Data Process",
    definition: "Stripping off protocol headers and trailers layer by layer as received data travels up toward the application.",
    definitionPt: "Processo inverso ao encapsulation: remover headers e trailers camada por camada até entregar o payload à aplicação."
  },
  {
    term: "Gateway",
    category: "Network Architecture",
    definition: "A functional role connecting different networks/protocols to perform routing, address translation, or protocol conversion.",
    definitionPt: "Função/ponto de saída que conecta redes ou arquiteturas diferentes, realizando roteamento, conversão de protocolo e troca de dados."
  },
  {
    term: "MPU",
    fullName: "Main Processing Unit",
    category: "Huawei Hardware",
    definition: "Mandatory board in a modular chassis that controls, manages, and monitors the entire device.",
    definitionPt: "Placa obrigatória em chassis modulares Huawei responsável por controlar, gerenciar e monitorar todo o equipamento."
  },
  {
    term: "SFU",
    fullName: "Switch Fabric Unit",
    category: "Huawei Hardware",
    definition: "Mandatory board in a modular chassis responsible for data exchange between all LPUs.",
    definitionPt: "Placa obrigatória de matriz de comutação em chassis modulares que interconecta e encaminha tráfego entre todas as LPUs."
  },
  {
    term: "LPU",
    fullName: "Line Processing Unit",
    category: "Huawei Hardware",
    definition: "Optional interface board in a modular device that provides physical ports and processes incoming/outgoing packets.",
    definitionPt: "Placa de linha opcional em dispositivos modulares que fornece portas físicas e processa os packets de entrada/saída."
  },
  {
    term: "SPU",
    fullName: "Service Processing Unit",
    category: "Huawei Hardware",
    definition: "Optional board in a modular chassis providing value-added service processing on traffic.",
    definitionPt: "Placa opcional em chassis modulares dedicada a serviços de valor agregado no processamento de packets."
  },
  {
    term: "CMU",
    fullName: "Central Management Unit",
    category: "Huawei Hardware",
    definition: "Optional board in a modular device that monitors environmental conditions such as ambient temperature.",
    definitionPt: "Placa opcional em dispositivos modulares que monitora condições ambientais, como limites de temperatura."
  },
  {
    term: "SCU",
    fullName: "Switch Control Unit",
    category: "Huawei Hardware",
    definition: "Integrated central control module inside Huawei fixed S-series Ethernet switches.",
    definitionPt: "Módulo de controle central integrado nos switches fixos Huawei da série S."
  },
  {
    term: "MPLS",
    fullName: "Multiprotocol Label Switching",
    category: "WAN / Carrier",
    definition: "High-speed carrier and WAN forwarding technology using short fixed-length labels instead of long IP lookups.",
    definitionPt: "Tecnologia de encaminhamento de alta velocidade para WANs e operadoras baseada em rótulos curtos (labels)."
  },
  {
    term: "SRv6",
    fullName: "Segment Routing over IPv6",
    category: "WAN / Carrier",
    definition: "Next-generation source-routing architecture encoding forwarding instructions directly in IPv6 extension headers.",
    definitionPt: "Arquitetura moderna de roteamento por segmento que codifica instruções de encaminhamento diretamente nos headers IPv6."
  },
  {
    term: "VLAN",
    fullName: "Virtual Local Area Network",
    category: "Switching",
    definition: "Logically segments one physical Layer 2 switch into multiple isolated broadcast domains.",
    definitionPt: "Segmenta logicamente um switch físico Layer 2 em múltiplos broadcast domains isolados."
  },
  {
    term: "VPN",
    fullName: "Virtual Private Network",
    category: "Security / WAN",
    definition: "Creates encrypted private tunnels across public networks like the Internet.",
    definitionPt: "Cria túneis privados e criptografados sobre redes públicas como a Internet."
  },
  {
    term: "OSPF",
    fullName: "Open Shortest Path First",
    category: "Routing",
    definition: "Widely deployed link-state Interior Gateway Protocol (IGP) that dynamically builds IP routing tables.",
    definitionPt: "Protocolo de roteamento dinâmico link-state (IGP) amplamente usado para construir routing tables IP automaticamente."
  },
  {
    term: "BGP",
    fullName: "Border Gateway Protocol",
    category: "Routing",
    definition: "Path-vector routing protocol used to exchange routes across autonomous systems on the Internet backbone.",
    definitionPt: "Protocolo de roteamento usado para trocar rotas entre sistemas autônomos no backbone da Internet e redes de operadoras."
  },
  {
    term: "LCP",
    fullName: "Link Control Protocol",
    category: "Data Link Layer",
    definition: "PPP sub-protocol used during the Establish phase to negotiate MRU, working mode, and authentication type.",
    definitionPt: "Subprotocolo do PPP usado na fase Establish para negociar MRU, modo de trabalho e método de autenticação."
  },
  {
    term: "NCP",
    fullName: "Network Control Protocol",
    category: "Data Link Layer",
    definition: "PPP sub-protocol (e.g., IPCP) used in the Network phase to negotiate Layer 3 parameters such as IP addresses.",
    definitionPt: "Subprotocolo do PPP (como o IPCP) usado na fase Network para negociar parâmetros Layer 3, como endereços IP."
  },
  {
    term: "CHAP",
    fullName: "Challenge-Handshake Authentication Protocol",
    category: "Security / PPP",
    definition: "Three-way handshake PPP authentication protocol that never sends plaintext passwords over the link.",
    definitionPt: "Protocolo de autenticação PPP em três etapas (challenge-handshake) que nunca transmite senhas em texto claro no link."
  },
  {
    term: "PAP",
    fullName: "Password Authentication Protocol",
    category: "Security / PPP",
    definition: "Simple two-way PPP authentication protocol that transmits username and password in plaintext.",
    definitionPt: "Protocolo simples de autenticação PPP em duas etapas que envia usuário e senha em texto claro."
  },
  {
    term: "UTP",
    fullName: "Unshielded Twisted Pair",
    category: "Physical Layer",
    definition: "Light, inexpensive, flexible Ethernet copper cable (e.g., Cat 5e/6 with RJ45, max 100 m) without metallic shielding.",
    definitionPt: "Cabo de par trançado sem blindagem (Cat 5e/6 com conector RJ45, alcance máximo de 100 m), leve, flexível e mais barato."
  },
  {
    term: "STP",
    fullName: "Shielded Twisted Pair",
    category: "Physical Layer",
    definition: "Copper twisted-pair cable wrapped in shielding to resist electromagnetic interference and eavesdropping.",
    definitionPt: "Cabo de par trançado com blindagem metálica contra interferência eletromagnética (EMI) e interceptação."
  },
  {
    term: "RJ45",
    category: "Physical Layer",
    definition: "Standard 8-pin modular connector terminating twisted-pair Ethernet cables up to 100 m.",
    definitionPt: "Conector modular padrão de 8 pinos usado nas pontas de cabos Ethernet de par trançado (até 100 m)."
  },
  {
    term: "PoE",
    fullName: "Power over Ethernet",
    category: "Physical Layer",
    definition: "Delivers DC electrical power alongside data over copper cabling to devices like APs and IP cameras.",
    definitionPt: "Fornece energia elétrica junto com dados pelo mesmo cabo de rede para alimentar dispositivos como APs e câmeras IP."
  },
  {
    term: "IoE",
    fullName: "Internet of Everything",
    category: "Trends",
    definition: "Modern connectivity era uniting people, processes, data, and intelligent devices via 5G, AI, and future 6G.",
    definitionPt: "Era da conectividade inteligente que une pessoas, dados, processos e objetos via 5G, IA e futuro 6G."
  },
  {
    term: "IoT",
    fullName: "Internet of Things",
    category: "Trends",
    definition: "Network of physical sensors, vehicles, and appliances exchanging data autonomously.",
    definitionPt: "Rede de sensores físicos, veículos e equipamentos industriais trocando dados de forma autônoma."
  },
  {
    term: "SD-WAN",
    fullName: "Software-Defined Wide Area Network",
    category: "WAN",
    definition: "Software-managed enterprise WAN architecture dynamically steering traffic across MPLS, broadband, and 5G links.",
    definitionPt: "Arquitetura WAN corporativa gerenciada por software que direciona tráfego dinamicamente entre MPLS, banda larga e 5G."
  },
  {
    term: "NMS",
    fullName: "Network Management System",
    category: "Operations",
    definition: "Centralized platform for monitoring device health, topology, alarms, and configuration across an enterprise network.",
    definitionPt: "Plataforma centralizada para monitorar saúde dos dispositivos, topologia, alarmes e configurações da rede."
  }
];

export const GLOSSARY_BY_KEY: Record<string, GlossaryEntry> = Object.fromEntries(
  HCIA_GLOSSARY.flatMap((entry) => {
    const pairs: [string, GlossaryEntry][] = [[entry.term.toLowerCase(), entry]];
    for (const alias of entry.aliases ?? []) {
      pairs.push([alias.toLowerCase(), entry]);
    }
    return pairs;
  })
);
