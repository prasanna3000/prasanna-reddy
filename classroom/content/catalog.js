/* Classroom content: plain JSON wrapped in ClassroomContent(...) so it loads from file:// too. */
ClassroomContent({
  "school": {
    "name": "The Classroom",
    "tagline": "learn it, then teach it",
    "welcome": "Welcome to class!",
    "intro": "Pick a classroom door. Every chapter has a chalkboard lesson, worked problems you reveal step by step, a lab bench to play with, flashcards, a pop quiz and a printable cheat sheet. Your stars are saved in this browser."
  },
  "semesters": [
    {
      "id": "sem1",
      "title": "Semester 1",
      "subtitle": "M.Tech AIML · BITS Pilani WILP · 2026",
      "courses": [
        {
          "id": "aiml-zg511",
          "code": "AIML ZG511",
          "title": "Deep Neural Networks",
          "room": "Room 511",
          "color": "#b5523b",
          "description": "Main text: Zhang, Lipton, Li & Smola, **Dive into Deep Learning** (2023). EC-2 mid-sem (closed book) and EC-3 comprehensive (open book, 5 Dec 2026).",
          "chapters": [
            {
              "id": "ch01",
              "number": 1,
              "title": "Introduction to Deep Learning",
              "comingSoon": true
            },
            {
              "id": "ch02",
              "number": 2,
              "title": "Artificial Neuron & Perceptron",
              "comingSoon": true
            },
            {
              "id": "ch03",
              "number": 3,
              "title": "Linear Neural Networks for Regression",
              "blurb": "One neuron that answers \"how much\": squared loss and batch gradient descent.",
              "file": "content/sem1/aiml-zg511/ch03-linear-regression.js"
            },
            {
              "id": "ch04",
              "number": 4,
              "title": "Linear Neural Networks for Classification",
              "comingSoon": true
            },
            {
              "id": "ch05",
              "number": 5,
              "title": "Deep Feedforward Networks",
              "comingSoon": true
            },
            {
              "id": "ch06",
              "number": 6,
              "title": "Convolutional Neural Networks",
              "comingSoon": true
            }
          ]
        }
      ]
    }
  ]
});
