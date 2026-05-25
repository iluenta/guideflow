'use client';

import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQ[];
}

/** Accordion FAQ section with local open/close state. */
export function FAQs({ faqs }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="lp-section" id="faq">
      <h2 className="lp-section-title">Preguntas frecuentes</h2>
      {faqs.map((faq, i) => (
        <div
          key={i}
          className={`lp-faq-item${openIndex === i ? ' lp-faq-open' : ''}`}
          onClick={() => setOpenIndex(openIndex === i ? null : i)}
        >
          <div className="lp-faq-q">
            <span>{faq.question}</span>
            <span className="lp-faq-icon">+</span>
          </div>
          <div className="lp-faq-a">{faq.answer}</div>
        </div>
      ))}
    </div>
  );
}
