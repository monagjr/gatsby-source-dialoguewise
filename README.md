# DialogueWise Gatsby Source Plugin

A Gatsby source plugin for sourcing data into your Gatsby application from [DialogueWise](https://dialoguewise.com).

## Install

`npm install --save gatsby-source-dialoguewise`

## How to use

```javascript
// In your gatsby-config.js
module.exports = {
  plugins: [    
    {
      resolve: `gatsby-source-dialoguewise`,
      options: {
        apiKey: 'YOUR_API_KEY',
        emailHash: 'YOUR_EMAIL_HASH',
        dialogues: [
            {
                name: 'hero-section',
                isPilot: false,
                variableList: {
                    '@wheel': 2
                },
            },
        ],
      },
    },
  ],
}
```

## How to query

You can query dialogue nodes like the following:

```graphql
{
  allDialogue {
    edges {
      node {
        name
        content
        error
      }
    }
  }
}
```

To filter by the `name` you specified in the config:

```graphql
{
  allFile(filter: { name: { eq: "hero-section" } }) {
    edges {
      node {
        name
        content
        error
      }
    }
  }
}
```

## Example usage

This is a sample page.

```javascript
import React from "react"
import { graphql } from "gatsby"

export default function DwDemo({ data }) {
  return (
    <div>
      <h1>DialogueWise Demo</h1>

      {data.allDialogue.edges.map(({ node }) => (
        JSON.parse(node.content).map( (content, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: content['hero-content'] }} />)
        )
      ))}
    </div>
  )
}

export const query = graphql`
query {
  allDialogue(filter: {name: {eq: "hero-section"}}) {
    edges {
      node {
        content
        name
        error
      }
    }
  }
}
`
```


