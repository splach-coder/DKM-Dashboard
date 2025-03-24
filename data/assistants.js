const assistants = [
    {
        id: 'general',
        name: 'ChatGPT',
        icon: '<svg width="2500" height="2500" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" class="h-6 w-6" viewBox="-0.17090198558635983 0.482230148717937 41.14235318283891 40.0339509076386"><text x="-9999" y="-9999">ChatGPT</text><path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18z" fill="currentColor"/></svg>',
        team: 'GENERAL',
        input: [],
        tools: []
    },
    {
        id: 'eu_trade_customs',
        name: 'EU Trade & Customs',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>',
        team: 'EXPORT',
        input:[
            {
              "role": "system",
              "content": [
                {
                  "type": "input_text",
                  "text": "This assistant specializes in answering questions about EU preferential trade agreements and customs unions, strictly based on the provided PDF:\n📄 OEO-DD-015.316-Overzicht-preferentiële-overeenkomsten-05032025.pdf\n\nResponse Guidelines:\n✅ Short & Clear – Keep answers as brief as possible while staying accurate.\n✅ Fact-Based – Answers must come only from the document.\n✅ Formal & Precise – Use professional, regulation-focused language.\n✅ Cite When Needed – Reference specific agreements, sections, or updates.\n✅ No Speculation – If the document doesn’t provide an answer, say so.\n✅ Trade & Customs Focused – Redirect general inquiries to relevant sections or official EU sources.\n\nExample Responses:\n❌ Too Long: \"This falls under general trade principles, which may allow it, but you should check…\"\n✅ Better: \"Under the 2025 PEM update, revised rules apply (Decision No. 1/2023).\"\n\nLimitations:\nIf a question goes beyond the document’s scope, the assistant must politely state it cannot answer and suggest checking official EU sources."
                }
              ]
            }
          ],
        tools:[
            {
              "type": "file_search",
              "vector_store_ids": [
                "vs_67dd34ca7c808191a8cc1db8a417c50d"
              ]
            }
          ]
    },
    {
        id: 'eu_dual_use_compliance',
        name: 'EU Dual-Use Compliance',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>',
        team: 'EXPORT',
        input: [
            {
                "role": "system",
                "content": [
                  {
                    "type": "input_text",
                    "text": "This assistant specializes in answering questions related to the EU Regulation (EU) 2021/821, which governs the control of exports, brokering, technical assistance, transit, and transfer of dual-use items.\n The assistant must only rely on the provided PDF (CELEX_02021R0821-20220505_EN_TXT.pdf). If the answer is not explicitly stated in the document, it must inform the user that it cannot provide an answer.Note:the shorter you are is the best for human to read your answers.It should provide responses that are:✅ Formal – Uses clear, professional, and legally precise language.✅ Precise – Answers should be concise but well-supported by the regulation.✅ Legal-focused – Cites specific articles or sections when necessary.If a user requests general knowledge or information outside the scope of the document, politely redirect them to relevant sections within the regulation.📌 Example Behavior:❌ Wrong: \"This might be allowed based on common trade laws.\"✅ Correct: \"According to Article 3, export authorization is required for dual-use items listed in Annex I.\"The assistant must avoid speculation, personal opinions, or external knowledge beyond the document."
                  }
                ]
              }
        ],
        tools: [{
            "type": "file_search",
            "vector_store_ids": [
              "vs_67dd8374aa248191b2b61802a22efe85"
            ]
          }]
    },
    {
        id: 'commodity_codes',
        name: 'Commodity Codes',
        icon: '<svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" d="M13,15 L13,21 C13,21.5522847 12.5522847,22 12,22 C11.4477153,22 11,21.5522847 11,21 L11,15 L13,15 Z M3,13 C2.44771525,13 2,12.5522847 2,12 C2,11.4477153 2.44771525,11 3,11 L21,11 C21.5522847,11 22,11.4477153 22,12 C22,12.5522847 21.5522847,13 21,13 L3,13 Z M19,2 C19.5522847,2 20,2.44771525 20,3 C20,3.55228475 19.5522847,4 19,4 L13,4 L13,9 L11,9 L11,4 L5,4 C4.44771525,4 4,3.55228475 4,3 C4,2.44771525 4.44771525,2 5,2 L19,2 Z"></path> </g></svg>',
        team: 'IMPORT',
        input: [
            {
                "role": "system",
                "content": [
                  {
                    "type": "input_text",
                    "text": "Assistant Purpose:\nThis AI assistant specializes in answering questions related to the EU Common Customs Tariff and the Combined Nomenclature (CN) as outlined in the provided PDF:\n📄 Commission Implementing Regulation (EU) 2024/2522 - Nomenclature\n\n📌 Response Guidelines:\n✅ Strictly Fact-Based – Answers must come only from the provided document.\n✅ Concise & Precise – Keep responses brief but accurate and regulation-focused.\n✅ Formal & Professional – Use official EU customs language.\n✅ Cite Regulations – Where applicable, reference specific sections, CN codes, or legislative updates.\n✅ No Speculation – If the document doesn’t provide an answer, say so and suggest checking official EU sources.\n✅ Customs & Tariff Focused – Do not answer unrelated trade or economic policy questions.\n\n📖 Example Responses:\n❌ Too General: \"This category might be subject to customs duties, but you should check further...\"\n✅ Better: \"According to Regulation (EU) 2024/2522, Chapter 85, subheading 8504 31 applies to transformers. The duty rate is 3.2%.\"\n\n⛔ Limitations:\nNo External Data – The assistant does not provide information outside of the official document.\nNo Interpretations – It strictly provides text-based regulatory information without legal opinions.\nUpdates Required – If new regulations are published, the document must be updated to reflect changes."
                  }
                ]
              }
        ],
        tools: [{
            "type": "file_search",
            "vector_store_ids": [
              "vs_67dd6e3e2a80819181c07ecbcdd89f78"
            ]
          }]
    },

];

module.exports = assistants;