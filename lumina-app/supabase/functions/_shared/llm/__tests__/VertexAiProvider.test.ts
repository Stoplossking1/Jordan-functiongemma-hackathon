import { describe, expect, it } from '@jest/globals';
import { type FunctionDeclarationSchema, SchemaType, type Tool } from '@google-cloud/vertexai';
import { convertToFunctionDeclarationSchema, fromCompletionTools } from '../VertexAiProvider.ts';

describe('VertexAiProvider', () => {
  // Example OpenAI:
  //   {
  //     "type": "function",
  //     "function": {
  //         "name": "get_weather",
  //         "description": "Get current temperature for a given location.",
  //         "parameters": {
  //             "type": "object",
  //             "properties": {
  //                 "location": {
  //                     "type": "string",
  //                     "description": "City and country e.g. Bogotá, Colombia"
  //                 }
  //             },
  //             "required": [
  //                 "location"
  //             ],
  //             "additionalProperties": False
  //         },
  //         "strict": True
  //     }
  // }

  // Example Vertex AI:
  // const functionDeclarations: Tool[] = [
  //   {
  //     functionDeclarations: [
  //       {
  //         name: 'get_current_weather',
  //         description: 'get weather in a given location',
  //         parameters: {
  //           type: SchemaType.OBJECT,
  //           properties: {
  //             location: { type: SchemaType.STRING },
  //             unit: {
  //               type: SchemaType.STRING,
  //               enum: ['celsius', 'fahrenheit'],
  //             },
  //           },
  //           required: ['location'],
  //         },
  //       },
  //     ],
  //   },
  // ];

  // const functionResponseParts = [
  //   {
  //     functionResponse: {
  //       name: 'get_current_weather',
  //       response: { name: 'get_current_weather', content: { weather: 'super nice' } },
  //     },
  //   },
  // ];

  it('convertToFunctionDeclarationSchema', () => {
    const actual = convertToFunctionDeclarationSchema({
      type: 'object',
      properties: {
        reason: { type: 'string' },
        decision: {
          type: 'boolean',
          description: 'my text',
        },
      },
      required: ['reason', 'decision'],
    });
    expect(actual).toEqual({
      type: SchemaType.OBJECT,
      properties: {
        reason: { type: SchemaType.STRING },
        decision: { type: SchemaType.BOOLEAN, description: 'my text' },
      },
      required: ['reason', 'decision'],
    } satisfies FunctionDeclarationSchema);
  });

  it('fromCompletionTools', () => {
    const actual = fromCompletionTools([
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get current temperature for a given location.',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'City and country e.g. Bogotá, Colombia',
              },
            },
            required: ['location'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    ]);
    expect(actual).toEqual([
      {
        functionDeclarations: [
          {
            name: 'get_weather',
            description: 'Get current temperature for a given location.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                location: { type: SchemaType.STRING, description: 'City and country e.g. Bogotá, Colombia' },
              },
              required: ['location'],
            },
          },
        ],
      },
    ] satisfies Tool[]);
  });
});
