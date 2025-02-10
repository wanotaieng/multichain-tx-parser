# Aptos Transaction Parser

An elegant and intuitive tool for parsing and understanding Aptos blockchain transactions with AI-powered explanations.

![Aptos Transaction Parser Screenshot](./public/screenshot.png)

## Features

- 🎯 **Dual Input Methods**
  - Parse transactions using raw JSON
  - Quick lookup using transaction hash
- 🤖 **AI-Powered Explanations**
  - Clear, concise transaction summaries
  - Human-readable format
- 🎨 **Modern UI/UX**
  - Clean and intuitive interface
  - Responsive design
  - Dark mode support
- 🔗 **Seamless Integration**
  - Direct links to Aptos Explorer
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

### Installation

1. Clone the repository
```bash
git clone https://github.com/pumpkinzomb/aptos-tx-parser.git
cd aptos-tx-parser
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
```

4. Start the development server
```bash
yarn dev
# or
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Usage

1. Choose your input method:
   - **JSON Input**: Paste raw transaction JSON
   - **Hash Input**: Enter transaction hash

2. Click "Parse Transaction" to analyze

3. View the:
   - Formatted transaction data
   - AI-generated explanation
   - Direct link to Aptos Explorer

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built by [zombcat](https://github.com/pumpkinzomb)
- Powered by OpenAI
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Built for the Aptos community

## Contact

zombcat - [@zombcat](https://twitter.com/zombcat)

Project Link: [https://github.com/pumpkinzomb/aptos-tx-parser](https://github.com/pumpkinzomb/aptos-tx-parser)