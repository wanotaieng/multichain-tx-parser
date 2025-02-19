# **MultiChain Transaction Parser: Mixture of Multichain Experts (MoME)**

## Short Summary
A unified AI-powered platform that intelligently parses and explains blockchain transactions across multiple networks, including Aptos, Ripple, and Polkadot.

## **Full Description**

**Problem & Motivation**  
In the rapidly evolving blockchain landscape, each network (Aptos, Ripple, Polkadot, etc.) has unique transaction structures and formats. Developers and end-users often struggle to parse on-chain data without specialized tooling or deep chain-specific expertise. This complexity hinders cross-chain collaboration and creates steep learning curves.

**Solution: Mixture of Multichain Experts (MoME)**  
MoME is a cross-chain AI platform that automatically detects which blockchain(s) a transaction belongs to, fetches relevant data from a vector database (Qdrant), then hands the transaction to a specialized “Expert” for that chain. Finally, an SLM (GPT-4o-mini) produces a **plain-English** summary and optional **Mermaid** diagram. By combining a **Routing Network** (ModernBERT) with **chain-specific Experts** and user feedback loops, MoME offers accurate, human-readable transaction explanations with minimal manual intervention.

## **Technical Description**

1. **Routing Network**  
   - **ModernBERT (~500M params)** classifies the raw transaction input to identify Aptos, Ripple, or Polkadot (potentially more chains in the future).  
   - Maintains high routing accuracy by continuously fine-tuning on new transaction formats and user feedback.  

2. **Qdrant Vector Database**  
   - Stores both **historical transaction data** and **user feedback** (thumbs up/down).  
   - Upon each query, the relevant chain Expert retrieves context to mitigate hallucinations and incorporate best practices from prior user sessions.  

3. **Chain Experts**  
   - **Specialized Models**: Each expert is “trained” or configured to interpret the chain’s custom transaction fields.  
   - **Augmentation**: Combines raw input with Qdrant context to form a comprehensive prompt for the LLM.  

4. **Small Language Model (GPT-4o-mini)**  
   - Generates a **human-readable explanation** of the transaction.  
   - Optionally produces a **Mermaid** diagram for visual clarity.  

5. **Infrastructure**  
   - **Aptos**: Move-based transaction reading and mainnet/testnet integration.  
   - **Ripple**: XRPL parsing (potentially RLUSD-based stablecoin or bridging logic).  
   - **Polkadot**: polkadot.js-based extrinsic decoding, especially for DeFi or asset hub use cases.

## **Roadmap**

### **Done**  
- **Routing Network**: Developed a query router (ModernBERT) that classifies incoming transactions by blockchain.  
- **Expert Model**: Implemented chain-specific experts that expand transaction context, reducing hallucinations.  
- **Re-Augmentation**: Integrated historical data and user feedback to refine transaction explanations.  
- **SLM Query**: Developed a pipeline that calls GPT-4o-mini to decode raw transaction data into human-readable summaries.  
- **Finetuned ModernBERT**: Improved routing accuracy to reliably direct queries to the appropriate chain expert.

### **To Do**  
- **Open Embedding Model**: Publish the embedding model used for Qdrant, including training script and evaluation metrics.
- **Add User Feedbacks**: Use user thumbs-up/down as reward signals to adapt the routing or chain experts over time.
- **Advanced Mermaid Output**: Generate richer diagrams, covering multi-step contract calls or cross-chain bridging flows.  
- **Scalability Upgrades**: Optimize vector database queries and expert models to handle higher transaction volumes in real-time.

## **Slides & Presentation**

**Canva Slide Deck**:  
[MoME Presentation](https://www.canva.com/yourMoMEProjectDeckLink)

This deck details the problem space, architecture, chain integrations, user feedback flow, and a future roadmap.

## **Repository: Getting Started**

**GitHub Repo**: https://github.com/wanotaieng/multichain-tx-parser

```bash
git clone https://github.com/wanotaieng/multichain-tx-parser.git
cd mome-multichain-parser
npm install
npm run dev
```

---

## **Demo Video**
TBD

---

## **Screenshots**

| Screenshot                                          | Description                                                                        |
|-----------------------------------------------------|------------------------------------------------------------------------------------|
| ![Transaction Parser Screenshot](./public/screenshot.png) | **Figure 1**: Front-end interface where user pastes transaction data.              |

---

## **How We Satisfy Hackathon Requirements**

1. **Use of Sponsor Tech**:  
   - Aptos transaction parsing and on-chain verification.  
   - Optional Polkadot extrinsic decoding or Ripple RLUSD stablecoin flows.  
2. **Open Source**:  
   - Entire codebase publicly available on GitHub (MIT license).  
3. **Short Summary & Full Description**:  
   - Provided at the start of this README.  
4. **Technical Description**:  
   - Detailed coverage of the pipeline, from ModernBERT routing to GPT-4o-mini inference.  
5. **Canva Slides**:  
   - Linked above.  
6. **Clear README**:  
   - Demo video, screenshots, and Loom walkthrough included.  

---

## **Future Potential**

- **Integrate Merkle Trade SDK**: Build AI trading agents on Aptos for leveraged positions.  
- **DeFi Tools on Polkadot**: Visualize multi-asset liquidity pools on Polkadot’s AssetHub.  
- **Cross-Chain Expansion**: Add Ethereum, Solana, or Cosmos experts to unify more ecosystems.  
- **Reinforcement Learning**: Use user thumbs-up/down as reward signals to adapt the routing or chain experts over time.

---

## **License & Contributions**

Licensed under the **MIT License**. We appreciate community feedback and pull requests. 

1. **Contribution**: Submit PRs for new chain experts, improved LLM prompts, or specialized retrieval plugins.  
2. **Contact**: Post issues on GitHub or reach us via the hackathon’s Discord/Telegram channels.

Thank you for exploring **Mixture of Multichain Experts (MoME)**—a next-generation solution for cross-chain transaction decoding, using state-of-the-art AI and user feedback to unify and simplify blockchain interactions. We look forward to scaling MoME to more chains and more sophisticated DeFi use cases!
