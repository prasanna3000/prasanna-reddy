/* Classroom content: plain JSON wrapped in ClassroomContent(...) so it loads from file:// too. */
ClassroomContent({
  "id": "ch04",
  "title": "Your chapter title",
  "subtitle": "Contact session 4 · T1 Chapter 4",
  "lesson": [
    {
      "title": "First board",
      "lead": "One sentence: the point of this board.",
      "blocks": [
        {
          "type": "p",
          "text": "A paragraph. Supports **bold**, `code`, ==highlight== and [links](https://example.com)."
        },
        {
          "type": "h",
          "text": "A small chalk heading"
        },
        {
          "type": "list",
          "items": [
            "A bullet",
            "Another bullet"
          ]
        },
        {
          "type": "steps",
          "items": [
            "Numbered step one",
            "Numbered step two"
          ]
        },
        {
          "type": "formula",
          "text": "ŷ = σ(wᵀx)",
          "caption": "optional caption"
        },
        {
          "type": "note",
          "label": "Teacher says",
          "text": "A sticky note. color can be \"pink\" or \"blue\".",
          "color": "pink"
        },
        {
          "type": "trap",
          "label": "Exam trap",
          "text": "A common mistake."
        },
        {
          "type": "table",
          "head": [
            "Col A",
            "Col B"
          ],
          "rows": [
            [
              "a1",
              "b1"
            ],
            [
              "a2",
              "b2"
            ]
          ]
        },
        {
          "type": "widget",
          "widget": "lr-bowl",
          "config": {
            "c": 4,
            "wstar": 2,
            "w0": -2,
            "eta": 0.15
          }
        }
      ]
    }
  ],
  "worked": [
    {
      "title": "Problem title",
      "tags": [
        "topic"
      ],
      "problem": [
        {
          "type": "p",
          "text": "The question, with all the numbers."
        }
      ],
      "steps": [
        {
          "label": "Step name",
          "text": "What to write for this step."
        },
        {
          "label": "Next",
          "text": "…"
        }
      ],
      "answer": "The final answer."
    }
  ],
  "labs": [
    {
      "title": "Lab title",
      "intro": "What to explore.",
      "tryThis": [
        "Thing to try"
      ],
      "widget": "gd-linear",
      "config": {
        "data": "1, 2\n2, 4\n3, 5",
        "eta": 0.1,
        "w0": "0, 0"
      }
    }
  ],
  "flashcards": [
    {
      "tag": "Definition",
      "front": "Question side",
      "back": "Answer side"
    }
  ],
  "quiz": [
    {
      "type": "mcq",
      "q": "Question?",
      "options": [
        "A",
        "B",
        "C",
        "D"
      ],
      "answer": 0,
      "explain": "Why A is right."
    },
    {
      "type": "numeric",
      "q": "Compute something.",
      "answer": 0.5,
      "tolerance": 0.01,
      "unit": "",
      "explain": "Working."
    }
  ],
  "formulas": [
    {
      "name": "Formula name",
      "formula": "the formula",
      "note": "optional note"
    }
  ]
});
