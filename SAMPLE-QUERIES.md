# TypeSafe Sample Queries

Copy any state into the playground and apply the matching questions below.

---

## 1. Stock Signal Check

**State:**
```
Tesla stock dropped 8% after earnings miss. Revenue came in at $24.3B vs $25.1B expected. EPS was $0.52 vs $0.62 expected. CEO blamed supply chain issues in China and said new Gigafactory timeline may slip to Q2. Short interest is up 12% this month.
```

**Questions:**
- `noul` — "This contains a material investment signal worth acting on"
- `choice` — "What type of signal is this?" with categories: `bearish: Negative fundamentals, bullish: Positive outlook, neutral: Factual reporting, noise: No actionable info`
- `score` — "How urgent is this for an investor to read?" with criteria: `Low priority — background context\nModerate — worth reviewing soon\nHigh — needs immediate attention`

---

## 2. Restaurant Menu Description Quality

**State:**
```
Wagyu A5 Tataki — Flash-seared Miyazaki A5 wagyu, ponzu reduction, micro shiso, black truffle salt, edible gold leaf. Serves 2. Seasonal availability.
```

**Questions:**
- `noul` — "This description would convince someone to order the dish"
- `choice` — "What is the primary selling point?" with categories: `ingredient: Highlights premium ingredients, technique: Emphasizes preparation method, presentation: Focuses on visual appeal, value: Suggests good deal`
- `score` — "How pretentious does this read?" with criteria: `Straightforward and honest\nA bit showy but acceptable\nInsufferably pretentious`

---

## 3. News Headline Classification

**State:**
```
Fed holds rates steady at 4.25-4.50%, signals potential cut in September if inflation continues cooling. Markets rally on the news.
```

**Questions:**
- `choice` — "What market does this primarily affect?" with categories: `equities: Stock market implications, bonds: Fixed income and rates, crypto: Cryptocurrency market, commodities: Gold, oil, metals, forex: Currency markets`
- `noul` — "This is likely to move markets significantly"
- `score` — "How actionable is this for a retail investor right now?" with criteria: `No action needed — just awareness\nWorth monitoring over the next week\nConsider adjusting positions today`

---

## 4. Email Spam vs Real

**State:**
```
Hey, I noticed you're running a Next.js project. We just launched a new deployment platform that's 3x faster than Vercel. Want to try it free for 3 months? Reply and I'll set up a demo call.
```

**Questions:**
- `noul` — "This is a legitimate business outreach, not spam"
- `choice` — "What is the sender's real intent?" with categories: `sell: Trying to sell something, recruit: Looking to hire you, collaborate: Genuine partnership opportunity, phishing: Suspicious or malicious`
- `score` — "How annoyed would you be receiving this?" with criteria: `Not at all — relevant and welcome\nMildly — slightly off-topic\nVery — complete waste of time`

---

## 5. Code Review Feedback Tone

**State:**
```
This PR looks good overall but the error handling in the API route is weak. You're catching all errors as generic exceptions and returning 500. Also the TypeScript types on the response are loose — you're using `any` in three places. Can you add proper error discrimination and tighten the types? The test coverage is also missing for the edge cases we discussed.
```

**Questions:**
- `noul` — "This feedback is constructive and actionable"
- `choice` — "What's the main concern?" with categories: `quality: Code quality issues, security: Potential vulnerabilities, performance: Speed or resource concerns, testing: Missing or weak tests`
- `score` — "How harsh is the tone?" with criteria: `Friendly and helpful\nDirect but fair\nBorderline rude`

---

## 6. Multi-Language Detection

**State:**
```
今天天气真好，我们去海边吧！I brought sunscreen and snacks. The forecast says it'll be sunny all afternoon — perfect beach weather.
```

**Questions:**
- `noul` — "The text contains more than one language"
- `choice` — "What languages are present?" with categories: `english: English text, chinese: Chinese text, mixed: Code-switching between languages, other: Another language`
- `score` — "How fluent does the code-switching feel?" with criteria: `Awkward — feels machine-translated\nNatural — normal bilingual flow\nSeamless — indistinguishable from a native bilingual speaker`

---

## 7. Product Comparison

**State:**
```
iPhone 17 Pro Max vs Samsung Galaxy S26 Ultra. The iPhone has the A19 Pro chip, 48MP main camera, titanium frame, and starts at $1,199. The Galaxy has the Snapdragon 8 Elite, 200MP camera, built-in S Pen, and starts at $1,299. Battery life is similar at around 14 hours screen-on time.
```

**Questions:**
- `choice` — "Which product does the text lean towards recommending?" with categories: `iphone: Leans toward Apple, samsung: Leans toward Samsung, neutral: No clear preference, incomplete: Needs more info`
- `noul` — "This comparison is biased toward one product"
- `score` — "How useful is this for a buying decision?" with criteria: `Not useful — too shallow\nSomewhat useful — covers basics\nVery useful — detailed and balanced`

---

## 8. Contract Red Flag

**State:**
```
The Agreement grants Company a perpetual, irrevocable, worldwide license to use, modify, and sublicense any materials created during the engagement. Contractor retains no rights to work product. Payment terms: Net 90 from invoice date. Late payments accrue interest at 1.5% monthly. Termination requires 90 days written notice.
```

**Questions:**
- `noul` — "This contract contains terms unfavorable to the contractor"
- `choice` — "What is the biggest red flag?" with categories: `ip: Intellectual property clauses, payment: Payment terms or delays, termination: Exit clauses, scope: Ambiguous scope definitions`
- `score` — "How exploitative does this read?" with criteria: `Standard — industry normal\nConcerning — worth negotiating\nAlarming — consider walking away`

---

## 9. Content Moderation

**State:**
```
This company is a complete scam. I paid $200 for their course and it's just recycled free content from YouTube. Everyone involved should be ashamed. Don't waste your money.
```

**Questions:**
- `choice` — "How should this content be categorized?" with categories: `legitimate_review: Genuine customer complaint, spam: Promotional or fake, harassment: Personal attacks, misinformation: Factually incorrect claims`
- `noul` — "This complaint contains specific, verifiable claims"
- `score` — "How emotionally charged is this?" with criteria: `Factual and measured\nEmotionally invested but civil\nVitriolic — borders on abuse`

---

## 10. Meeting Notes Actionability

**State:**
```
Discussed Q3 roadmap. Engineering will prioritize the API migration. Marketing wants the landing page done by Sept 15. Design team has concerns about the new component library but will try it for two sprints. Sarah to set up the staging environment by Friday. Need to circle back on pricing — no decision made.
```

**Questions:**
- `noul` — "Every action item has a clear owner"
- `choice` — "What is the most resolved topic?" with categories: `engineering: Tech/backend work, marketing: Growth/brand work, design: UI/UX work, finance: Pricing/money decisions`
- `score` — "How actionable are these notes?" with criteria: `Vague — nothing is clearly assigned\nMostly clear — a few loose ends\nVery actionable — owners, dates, and deliverables defined`
