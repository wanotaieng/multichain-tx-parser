# Multichain Transaction Parser

A unified blockchain transaction parser with AI-powered explanations - supporting multiple chains including Aptos, Ripple, and Polkadot.

![Multichain Transaction Parser Screenshot](./public/screenshot.png)

## Features

- 🌐 **Multi-Chain Support**
  - Aptos blockchain
  - Ripple (XRP) network
  - Polkadot network
  - More chains coming soon
- 🧠 **MOCE (Mixture of Chain Experts)**
  - Intelligent chain detection
  - Chain-specific transaction analysis
  - Automatic format recognition
- 🤖 **AI-Powered Explanations**
  - Clear, concise transaction summaries
  - Chain-specific interpretation
  - Human-readable format
- 🎨 **Modern UI/UX**
  - Clean and intuitive interface
  - Responsive design
  - Dark mode support
- 🔗 **Seamless Integration**
  - Direct links to respective block explorers
  - Copy-paste friendly JSON viewer

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- OpenAI API

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- yarn or npm
- OpenAI API key
- Subscan API key (for Polkadot support)

### Installation

1. Clone the repository
```bash
git clone https://github.com/pumpkinzomb/multichain-tx-parser.git
cd multichain-tx-parser
```

2. Install dependencies
```bash
yarn install
# or
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
```
ELYN_API_KEY=your_api_key_here
ELYN_API_ENDPOINT=your_api_endpoint_here
SUBSCAN_API_KEY=your_subscan_api_key_here
```

4. Start the development server
```bash
yarn dev
# or
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Usage

1. Input your transaction:
   - **JSON Input**: Paste raw transaction JSON from any supported chain
   - **Hash Input**: Enter transaction hash

2. The system will automatically:
   - Detect the blockchain network
   - Parse the transaction
   - Generate an AI-powered explanation
   - Provide a link to the appropriate block explorer

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- Built by [zombcat](https://github.com/pumpkinzomb)
- Powered by OpenAI
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Special thanks to the blockchain communities

## Contact

zombcat - [@zombcat](https://twitter.com/zombcat)

Project Link: [https://github.com/pumpkinzomb/multichain-tx-parser](https://github.com/pumpkinzomb/multichain-tx-parser)