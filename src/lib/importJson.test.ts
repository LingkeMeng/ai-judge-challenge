import { describe, it, expect } from 'vitest'
import { parseImportJson } from './importJson'

describe('parseImportJson', () => {
  it('parses valid spec format', () => {
    const json = `[
      {
        "id": "sub_1",
        "queueId": "queue_1",
        "labelingTaskId": "task_1",
        "createdAt": 1690000000000,
        "questions": [
          {
            "rev": 1,
            "data": {
              "id": "q_template_1",
              "questionType": "single_choice_with_reasoning",
              "questionText": "Is the sky blue?"
            }
          }
        ],
        "answers": {
          "q_template_1": {
            "choice": "yes",
            "reasoning": "Observed on a clear day."
          }
        }
      }
    ]`
    const data = parseImportJson(json)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].queueId).toBe('queue_1')
    expect(data[0].questions).toHaveLength(1)
    expect(data[0].questions[0].data.questionText).toBe('Is the sky blue?')
    expect(data[0].answers['q_template_1'].choice).toBe('yes')
  })

  it('throws if root is not array', () => {
    expect(() => parseImportJson('{"submissions": []}')).toThrow('root must be an array')
  })

  it('throws if queueId is missing', () => {
    const json = `[{"questions": [], "answers": {}}]`
    expect(() => parseImportJson(json)).toThrow('queueId must be a string')
  })

  it('throws if question data is invalid', () => {
    const json = `[{
      "queueId": "q1",
      "questions": [{"data": {"id": "x"}}],
      "answers": {}
    }]`
    expect(() => parseImportJson(json)).toThrow('questionText must be a string')
  })

  it('throws if answers is not object', () => {
    const json = `[{
      "queueId": "q1",
      "questions": [{"data": {"id": "x", "questionText": "Q"}}],
      "answers": []
    }]`
    expect(() => parseImportJson(json)).toThrow('answers must be an object')
  })
})
