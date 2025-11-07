import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export interface ExamAnswer {
  id?: number;
  question_id: number;
  question_text: string;
  selected_option_id: number;
  selected_option_text: string;
  created_at: string;
}

export class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private examId: string;
  private dbName: string;

  constructor(examId: string) {
    this.examId = examId;
    // Single shared DB file
    this.dbName = `zysktms.db`;
  }

  
  async initializeDatabase(): Promise<void> {
    try {
      // Open or create the shared database
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      // Ensure per-exam table exists
      await this.ensureExamTable();
      console.log(`Database ${this.dbName} initialized successfully with table ${this.tableName()}`);
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /** Open the shared DB without creating any exam table */
  private async openDb(): Promise<void> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(this.dbName);
    }
  }

  // Sanitize exam id into a safe SQLite table name
  private tableName(): string {
    const safe = String(this.examId || '').replace(/[^a-zA-Z0-9_]/g, '_');
    if (!safe || safe.trim().length === 0) {
      return `exam_answers_invalid`;
    }
    const prefixed = /^[0-9]/.test(safe) ? `t_${safe}` : safe;
    return `exam_answers_${prefixed}`;
  }

  private async ensureExamTable(): Promise<void> {
    await this.openDb();
    await this.db!.execAsync(`
      CREATE TABLE IF NOT EXISTS ${this.tableName()} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        selected_option_id INTEGER NOT NULL,
        selected_option_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(question_id)
      );
    `);
  }

  private async withReconnect<T>(op: () => Promise<T>, onReconnect?: () => Promise<void>): Promise<T> {
    try {
      return await op();
    } catch (err) {
      // Attempt one reconnection cycle then retry
      try {
        await this.openDb();
        if (onReconnect) {
          await onReconnect();
        }
        return await op();
      } catch (e) {
        throw e;
      }
    }
  }

  
  async checkDatabaseExists(): Promise<boolean> {
    try {
      await this.openDb();
      const tableExistsRows = await this.db?.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
        [this.tableName()]
      ) as { name: string }[];
      const exists = !!(tableExistsRows && tableExistsRows.length > 0);
      if (!exists) {
        console.log(`No table for exam ${this.examId}; treating as no existing data`);
        return false;
      }
      const result = await this.db?.getAllAsync(
        `SELECT COUNT(*) as count FROM ${this.tableName()}`,
        []
      ) as { count: number }[];
      const count = result?.[0]?.count || 0;
      console.log(`Found ${count} existing answers for exam ${this.examId} in table ${this.tableName()}`);
      return count > 0;
    } catch (error) {
      console.error('Error checking database existence:', error);
      return false;
    }
  }


  async saveAnswer(
    questionId: number,
    questionText: string,
    selectedOptionId: number,
    selectedOptionText: string
  ): Promise<void> {
    try {
      if (!this.db) {
        await this.initializeDatabase();
      }
      await this.ensureExamTable();
      const answer: ExamAnswer = {
        question_id: questionId,
        question_text: questionText,
        selected_option_id: selectedOptionId,
        selected_option_text: selectedOptionText,
        created_at: new Date().toISOString(),
      };

      await this.withReconnect(
        () => this.db!.runAsync(
          `INSERT OR REPLACE INTO ${this.tableName()} 
           (question_id, question_text, selected_option_id, selected_option_text, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [answer.question_id, answer.question_text, answer.selected_option_id, answer.selected_option_text, answer.created_at]
        ),
        async () => {
          await this.ensureExamTable();
        }
      );

      console.log(`Answer saved for question ${questionId}, option ${selectedOptionId}`);
    } catch (error) {
      console.warn('Error saving answer (non-fatal):', error);
    }
  }

  async saveAnswerNoThrow(
    questionId: number,
    questionText: string,
    selectedOptionId: number,
    selectedOptionText: string
  ): Promise<void> {
    try {
      await this.saveAnswer(questionId, questionText, selectedOptionId, selectedOptionText);
    } catch {}
  }


  async getAllAnswers(): Promise<ExamAnswer[]> {
    try {
      if (!this.db) {
        await this.initializeDatabase();
      }
      await this.ensureExamTable();
      const results = await this.withReconnect(
        () => this.db!.getAllAsync(
          `SELECT * FROM ${this.tableName()} ORDER BY question_id`,
          []
        ),
        async () => {
          await this.ensureExamTable();
        }
      );

      return results as ExamAnswer[] || [];
    } catch (error) {
      console.error('Error getting answers:', error);
      return [];
    }
  }

  /**
   * Get a specific answer by question ID
   */
  async getAnswerByQuestionId(questionId: number): Promise<ExamAnswer | null> {
    try {
      if (!this.db) {
        await this.initializeDatabase();
      }
      await this.ensureExamTable();
      const result = await this.withReconnect(
        () => this.db!.getFirstAsync(
          `SELECT * FROM ${this.tableName()} WHERE question_id = ?`,
          [questionId]
        ),
        async () => {
          await this.ensureExamTable();
        }
      );

      return result as ExamAnswer || null;
    } catch (error) {
      console.error('Error getting answer by question ID:', error);
      return null;
    }
  }

  /**
   * Delete all answers for the current exam (useful for resetting)
   */
  async clearAllAnswers(): Promise<void> {
    try {
      if (!this.db) {
        await this.initializeDatabase();
      }
      await this.ensureExamTable();
      await this.withReconnect(
        () => this.db!.runAsync(`DELETE FROM ${this.tableName()}`)
      );

      console.log(`All answers cleared for exam ${this.examId}`);
    } catch (error) {
      console.error('Error clearing answers:', error);
      throw error;
    }
  }

  /** Drop the entire exam-specific table */
  async dropExamTable(): Promise<void> {
    try {
      if (!this.db) {
        await this.initializeDatabase();
      }
      await this.withReconnect(
        () => this.db!.execAsync(`DROP TABLE IF EXISTS ${this.tableName()};`)
      );
      console.log(`Dropped table for exam ${this.examId} (${this.tableName()})`);
    } catch (error) {
      console.error('Error dropping exam table:', error);
    }
  }

  /**
   * Close and delete the underlying SQLite database file for this exam.
   * Falls back silently if platform/version does not support deleteDatabaseAsync.
   */
  async deleteDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
      const deleter = (SQLite as any).deleteDatabaseAsync;
      if (typeof deleter === 'function') {
        await deleter(this.dbName);
        console.log(`Database ${this.dbName} deleted`);
      } else {
        // Fallback: attempt to delete the underlying file directly
        try {
          const baseDir = ((FileSystem as any).documentDirectory as string | undefined) ?? ((FileSystem as any).cacheDirectory as string | undefined);
          if (!baseDir) {
            throw new Error('No writable directory available from FileSystem');
          }
          const sqliteDir = `${baseDir}SQLite/`;
          const dbPath = `${sqliteDir}${this.dbName}`;
          const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
          if (!dirInfo.exists) {
            // Directory missing; nothing to delete
            console.log('SQLite directory not found; assuming DB already removed');
          } else {
            const fileInfo = await FileSystem.getInfoAsync(dbPath);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(dbPath, { idempotent: true });
              console.log(`Database file ${dbPath} deleted`);
            } else {
              console.log('Database file not present; nothing to delete');
            }
          }
        } catch (fsErr) {
          console.warn('FileSystem delete failed, clearing answers as final fallback:', fsErr);
          await this.initializeDatabase();
          await this.dropExamTable();
        }
      }
    } catch (error) {
      console.error('Error deleting database:', error);
    }
  }
  async closeDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}