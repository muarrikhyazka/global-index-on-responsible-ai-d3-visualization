# Global Index on Responsible AI - D3 Visualization

An interactive D3.js visualization exploring the challenges in responsible AI development across the globe based on the Global Index on Responsible AI (GIRAI) 2024.

## Overview

This project presents "Beastly Challenges in Responsible AI and Where to Find Them" - a comprehensive visualization that maps 10 key challenges identified in the GIRAI 2024 report across different countries and continents. The visualization highlights the complexity and diversity of issues that nations face as they navigate the ever-changing landscape of AI ethics and governance.

## Features

- Interactive circular packing visualization using D3.js
- Global mapping of 10 key responsible AI challenges
- Country-level analysis across 138 countries organized by 6 continents
- Responsive design optimized for desktop and mobile devices
- Detailed issue explanations and characteristics

## 10 Key Challenges

1. **Responsible AI Governance** - No Government Framework in National AI Policy
2. **Government Framework for Protecting Human Rights** - Missing frameworks for remedy, impact assessments, and public procurement
3. **International Cooperation in Responsible AI** - Lack of international cooperation frameworks
4. **Responsible AI and Gender** - Missing government frameworks and actions
5. **Inclusion and Equality** - No evidence in bias prevention, children's rights, and cultural diversity
6. **Labor Protection from Government** - Missing frameworks and government actions
7. **Cultural and Linguistic** - No government frameworks or non-state actor involvement
8. **Government Led-Activity on Safety, Security and Reliability** - Missing frameworks and actions
9. **Crucial Role of Non-State Actors** - No evidence of non-state actor initiatives
10. **Long Way to Go** - Countries scoring only up to 25 points out of 100 in GIRAI

## Project Structure

```
├── index.html              # Main HTML file
├── css/
│   └── style.css           # Main stylesheet
├── js/
│   └── main.js            # Main JavaScript visualization code
├── data/
│   ├── girai_country_hierarchy.json  # Country and continent hierarchy
│   ├── girai_country_name.json       # Country name mappings
│   ├── girai_issue_per_country.json  # Issue data per country
│   └── girai_continent.json          # Continent data
├── plugins/
│   ├── d3.min.js                     # D3.js library
│   ├── d3-annotation.min.js          # D3 annotation plugin
│   └── webfont.js                    # Web font loader
└── img/
    └── favicon/                      # Favicon files
```

## Technologies Used

- **D3.js** - Data visualization library
- **HTML5/CSS3** - Structure and styling
- **JavaScript ES5** - Interactive functionality
- **Google Fonts** - Barlow and Barlow Semi Condensed font families
- **Responsive Design** - Mobile and desktop optimization

## Getting Started

1. Clone or download the repository
2. Open `index.html` in a web browser
3. The visualization will load automatically once fonts are ready

No build process or server setup required - this is a client-side only application.

## Data Sources

Based on the Global Index on Responsible AI (GIRAI) 2024 report, analyzing 138 countries across 6 continents for responsible AI governance and implementation.

## Browser Compatibility

- Modern browsers with JavaScript enabled
- Responsive design supports mobile and desktop viewports
- Optimized for screens 500px and larger

## Author

Created by Fasrot

## License

This project is part of a scientific research initiative on responsible AI governance visualization.