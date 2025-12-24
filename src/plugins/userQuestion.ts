/**
 * User Question Plugin
 *
 * Provides a tool that allows the AI to ask the user multiple choice
 * questions via a modal dialog. The executor returns a Promise that
 * resolves when the user makes a selection, enabling synchronous-feeling
 * async user interaction.
 *
 * This demonstrates:
 * - Tool executor returning a Promise for async UI interaction
 * - Creating and managing DOM elements from an executor
 * - Collecting user input and returning it to the AI
 */

import type { HustlePlugin, ClientToolDefinition, ToolExecutor } from '../types';

/**
 * Create modal styles if they don't exist
 */
function ensureModalStyles(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'user-question-modal-styles';
  if (document.getElementById(styleId)) return;

  const styles = document.createElement('style');
  styles.id = styleId;
  styles.textContent = `
    .user-question-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: uqFadeIn 0.2s ease-out;
    }

    @keyframes uqFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .user-question-modal {
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 24px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      animation: uqSlideUp 0.2s ease-out;
    }

    @keyframes uqSlideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .user-question-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      margin: 0 0 16px 0;
    }

    .user-question-choices {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }

    .user-question-choice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #252540;
      border: 1px solid #333;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .user-question-choice:hover {
      background: #2a2a4a;
      border-color: #4a4a6a;
    }

    .user-question-choice.selected {
      background: #2a3a5a;
      border-color: #4a7aff;
    }

    .user-question-choice input {
      margin: 0;
      accent-color: #4a7aff;
    }

    .user-question-choice label {
      flex: 1;
      color: #e0e0e0;
      cursor: pointer;
      font-size: 14px;
    }

    .user-question-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .user-question-btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .user-question-btn-cancel {
      background: transparent;
      border: 1px solid #444;
      color: #aaa;
    }

    .user-question-btn-cancel:hover {
      background: #333;
      color: #fff;
    }

    .user-question-btn-submit {
      background: #4a7aff;
      border: none;
      color: #fff;
    }

    .user-question-btn-submit:hover {
      background: #5a8aff;
    }

    .user-question-btn-submit:disabled {
      background: #333;
      color: #666;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(styles);
}

/**
 * Tool definition for ask_user
 */
const askUserTool: ClientToolDefinition = {
  name: 'ask_user',
  description: `Ask the user a multiple choice question and wait for their response. Use this when you need user input to proceed - for example: clarifying requirements, getting preferences, or confirming actions. The tool blocks until the user responds.`,
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The question to ask the user',
      },
      choices: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of choices to present (2-6 options recommended)',
      },
      allowMultiple: {
        type: 'boolean',
        description: 'If true, user can select multiple choices. Default: false',
      },
    },
    required: ['question', 'choices'],
  },
};

/**
 * Arguments for ask_user tool
 */
interface AskUserArgs {
  question: string;
  choices: string[];
  allowMultiple?: boolean;
}

/**
 * Result from ask_user tool
 */
interface AskUserResult {
  question: string;
  selectedChoices: string[];
  answered: boolean;
}

/**
 * Executor for ask_user tool
 * Creates a modal and returns a Promise that resolves when user responds
 */
const askUserExecutor: ToolExecutor = async (args: Record<string, unknown>): Promise<AskUserResult> => {
  const { question, choices, allowMultiple = false } = args as unknown as AskUserArgs;

  // Validate inputs
  if (!question || !choices || !Array.isArray(choices) || choices.length === 0) {
    return {
      question: question || '',
      selectedChoices: [],
      answered: false,
    };
  }

  // Server-side fallback
  if (typeof document === 'undefined') {
    console.log(`[User Question] Question: ${question}`);
    console.log(`[User Question] Choices: ${choices.join(', ')}`);
    return {
      question,
      selectedChoices: [choices[0]],
      answered: true,
    };
  }

  ensureModalStyles();

  return new Promise<AskUserResult>((resolve) => {
    const selected = new Set<string>();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'user-question-overlay';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'user-question-modal';

    // Title
    const title = document.createElement('h3');
    title.className = 'user-question-title';
    title.textContent = question;
    modal.appendChild(title);

    // Choices container
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'user-question-choices';

    const inputType = allowMultiple ? 'checkbox' : 'radio';
    const inputName = `uq-${Date.now()}`;

    choices.forEach((choice, index) => {
      const choiceDiv = document.createElement('div');
      choiceDiv.className = 'user-question-choice';

      const input = document.createElement('input');
      input.type = inputType;
      input.name = inputName;
      input.id = `${inputName}-${index}`;
      input.value = choice;

      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.textContent = choice;

      choiceDiv.appendChild(input);
      choiceDiv.appendChild(label);

      // Handle selection
      const handleSelect = () => {
        if (allowMultiple) {
          if (selected.has(choice)) {
            selected.delete(choice);
            choiceDiv.classList.remove('selected');
          } else {
            selected.add(choice);
            choiceDiv.classList.add('selected');
          }
        } else {
          selected.clear();
          selected.add(choice);
          choicesDiv.querySelectorAll('.user-question-choice').forEach(c => c.classList.remove('selected'));
          choiceDiv.classList.add('selected');
        }
        updateSubmitButton();
      };

      input.addEventListener('change', handleSelect);
      choiceDiv.addEventListener('click', (e) => {
        if (e.target !== input) {
          input.checked = !input.checked || !allowMultiple;
          handleSelect();
        }
      });

      choicesDiv.appendChild(choiceDiv);
    });

    modal.appendChild(choicesDiv);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'user-question-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'user-question-btn user-question-btn-cancel';
    cancelBtn.textContent = 'Skip';
    cancelBtn.onclick = () => {
      cleanup();
      resolve({
        question,
        selectedChoices: [],
        answered: false,
      });
    };

    const submitBtn = document.createElement('button');
    submitBtn.className = 'user-question-btn user-question-btn-submit';
    submitBtn.textContent = 'Submit';
    submitBtn.disabled = true;
    submitBtn.onclick = () => {
      cleanup();
      resolve({
        question,
        selectedChoices: Array.from(selected),
        answered: true,
      });
    };

    const updateSubmitButton = () => {
      submitBtn.disabled = selected.size === 0;
    };

    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Cleanup function
    const cleanup = () => {
      overlay.remove();
    };

    // Close on escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleEscape);
        cleanup();
        resolve({
          question,
          selectedChoices: [],
          answered: false,
        });
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
};

/**
 * User Question Plugin
 *
 * Provides the ask_user tool for AI to request user input via modal.
 */
export const userQuestionPlugin: HustlePlugin = {
  name: 'user-question',
  version: '1.0.0',
  description: 'Allows AI to ask users multiple choice questions via modal',

  tools: [askUserTool],
  executors: {
    ask_user: askUserExecutor,
  },

  hooks: {
    onRegister: () => {
      console.log('[User Question] Plugin registered - AI can now ask you questions');
    },
  },
};
