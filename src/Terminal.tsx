import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { executeCommand } from './commands';
import { TerminalLine } from './types';
import BlinkingText from './BlinkingText';
import TypingText from './TypingText';
import { supabase } from './lib/supabase';
import AdminPanel from './AdminPanel';

function ColoredText({ text }: { text: string }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            color: Math.random() > 0.5 ? '#00ff9d' : '#ffffff',
          }}
        >
          {char}
        </span>
      ))}
    </>
  );
}

const bootSequence = [
  { content: 'POLITICAL AUTOMATION SYSTEM v3.1', delay: 200, glitch: false },
  { content: 'INITIALIZING TWITTER BOT...', delay: 100, glitch: false },
  { content: 'LOADING POLITICAL DATABASE...', delay: 40, glitch: false },
  { content: 'TRUMP ARCHIVE: OK', delay: 40, glitch: false },
  { content: 'MAGA KEYWORDS: OK', delay: 40, glitch: false },
  { content: 'TWEET GENERATOR: L0@DING...', delay: 450, glitch: false },
  { content: 'TWEET GENERATOR: OK', delay: 40, glitch: false },
  { content: 'ENGAGEMENT TRACKER: OK', delay: 40, glitch: false },
  { content: '', delay: 400 },
  { content: 'CONNECTING TO TWITTER API...', delay: 600, glitch: false },
  { content: 'ERR: RATE LIMIT', delay: 150, glitch: false },
  { content: 'RETRY...', delay: 800, glitch: false },
  { content: 'CONNECTION OK', delay: 300, glitch: false },
  { content: '', delay: 600 },
  { content: 'PR#ME', delay: 180, glitch: false },
  { content: 'P R I M E   C L O U D', delay: 900, glitch: false },
  { content: '', delay: 500 },
  { content: 'loading political modules:', delay: 250, glitch: false },
  { content: '  [OK]   trump_quotes.db', delay: 60, glitch: false },
  { content: '  [OK]   hashtag_generator.sys', delay: 60, glitch: false },
  { content: '  [OK]   auto_reply.sys', delay: 60, glitch: false },
  { content: '  [ACTIVE] scheduler.sys', delay: 400, glitch: false },
  { content: '', delay: 800 },
  { content: 'target: @primecloud_', delay: 100, glitch: false },
  { content: 'posts scheduled: 24/7', delay: 100, glitch: false },
  { content: 'engagement mode: maximum', delay: 150, glitch: false },
  { content: 'bias filter: conservative', delay: 200, glitch: false },
  { content: '', delay: 700 },
  { content: 'automation: FULL', delay: 150, glitch: false },
  { content: '', delay: 600 },
  { content: 'system: online', delay: 200, glitch: false },
  { content: 'operator: @primecloud_', delay: 200, glitch: false },
  { content: '', delay: 900 },
  { content: 'ready to post.', delay: 500, glitch: false },
];

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [bootComplete, setBootComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [launchTime, setLaunchTime] = useState('');
  const [showLaunchTime, setShowLaunchTime] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFooterAndLaunch, setShowFooterAndLaunch] = useState(false);
  const [showFooterText, setShowFooterText] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('config')
      .select('key, value')
      .in('key', ['launch_time', 'launch_enabled']);

    if (data) {
      const launchTimeConfig = data.find(c => c.key === 'launch_time');
      const launchEnabledConfig = data.find(c => c.key === 'launch_enabled');

      if (launchTimeConfig) {
        setLaunchTime(launchTimeConfig.value);
      }
      if (launchEnabledConfig) {
        setShowLaunchTime(launchEnabledConfig.value === 'true');
      }
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: number;

    const addBootLine = () => {
      if (currentIndex < bootSequence.length) {
        const bootLine = bootSequence[currentIndex];
        setLines((prev) => [
          ...prev,
          {
            type: 'system',
            content: bootLine.content,
            timestamp: Date.now(),
            glitch: bootLine.glitch,
          },
        ]);

        currentIndex++;
        timeoutId = setTimeout(addBootLine, bootLine.delay);
      } else {
        setIsTransitioning(true);
        setTimeout(() => {
          setBootComplete(true);
          setLines([]);
          setTimeout(() => {
            setShowFooterAndLaunch(true);
            inputRef.current?.focus();
          }, 500);
        }, 800);
      }
    };

    timeoutId = setTimeout(addBootLine, 200);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();

    setLines((prev) => [
      ...prev,
      { type: 'input', content: `> ${trimmedCmd}`, timestamp: Date.now() },
    ]);

    if (trimmedCmd.toLowerCase() === 'admin.panel') {
      setShowAdmin(true);
      setInput('');
      return;
    }

    if (trimmedCmd.toLowerCase() === 'clear') {
      setTimeout(() => {
        setLines([]);
        setInput('');
      }, 100);
      return;
    }

    const response = executeCommand(trimmedCmd);

    setTimeout(() => {
      const newLines: TerminalLine[] = response.output.map((line) => ({
        type: response.type || 'output',
        content: line,
        timestamp: Date.now(),
        glitch: response.glitch,
      }));

      setLines((prev) => [...prev, ...newLines]);
    }, Math.random() * 100 + 50);

    if (trimmedCmd) {
      setCommandHistory((prev) => [...prev, trimmedCmd]);
    }
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        handleCommand(input);
      } else {
        setLines((prev) => [
          ...prev,
          { type: 'input', content: '>', timestamp: Date.now() },
        ]);
        setInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      handleCommand('clear');
    }
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <div
        className="terminal-container"
        onClick={handleTerminalClick}
      >
        <div className="crt-effect" />
        <div className="dead-pixels" />
        <div className="static-noise" />

        {showFooterAndLaunch && showLaunchTime && launchTime && (
          <div className="launch-time">
            <TypingText text={launchTime} delay={40} onComplete={() => setShowFooterText(true)} />
          </div>
        )}
        {showFooterAndLaunch && (
          <div className="system-info">
            <TypingText text="© 2026 Prime Cloud. All About Politics" delay={30} />
          </div>
        )}

      {!bootComplete ? (
        <div className={`boot-screen ${isTransitioning ? 'fade-out' : ''}`}>
          <div className="boot-content">
            {lines.map((line, index) => (
              <div
                key={`${line.timestamp}-${index}`}
                className={`terminal-line ${line.type} ${line.glitch ? 'glitch' : ''}`}
              >
                <BlinkingText text={line.content} />
              </div>
            ))}
          </div>
          <a href="https://x.com/primecloud_" target="_blank" rel="noopener noreferrer" className="boot-x-link">
            <ColoredText text="Visit @primecloud_" />
          </a>
        </div>
      ) : (
        <div className="terminal-frame fade-in">

          <div className="terminal-header">
            <div className="header-top">
              <div className="header-title"><ColoredText text="P R I M E   C L O U D" /></div>
              <a href="https://x.com/primecloud_" target="_blank" rel="noopener noreferrer" className="header-social">
                <ColoredText text="@primecloud_" />
              </a>
            </div>
            <div className="header-divider" />
            <div className="header-status"><ColoredText text="twitter bot: active" /></div>
            <div className="header-status"><ColoredText text="posts: automated" /></div>
          </div>

          <div ref={terminalRef} className="terminal-content">
            <div className="terminal-lines">
              {lines.map((line, index) => (
                <div
                  key={`${line.timestamp}-${index}`}
                  className={`terminal-line ${line.type} ${
                    line.glitch ? 'glitch' : ''
                  }`}
                >
                  <BlinkingText text={line.content} />
                </div>
              ))}
            </div>

            <div className="terminal-input-line">
              {showPrompt ? (
                <>
                  <span className="prompt"><TypingText text="primecloud@twitter:~$" delay={40} /></span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="terminal-input"
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                  <span className="cursor"><ColoredText text="_" /></span>
                </>
              ) : (
                <span className="prompt" style={{ opacity: 0 }}>.</span>
              )}
            </div>
          </div>

          {showFooterAndLaunch && (
            <div className="terminal-footer">
              <div className="footer-line footer-line-split">
                <span><TypingText text='type "help"' delay={35} /></span>
                <span><TypingText text="check out the docs" delay={35} /></span>
              </div>
              {showFooterText && (
                <div className="footer-line footer-line-split">
                  <span><TypingText text="prime cloud :: terminal active" delay={35} /></span>
                  <a href="https://github.com/PrimeCloudOfficial/Prime-Cloud" target="_blank" rel="noopener noreferrer" className="github-link">
                    <TypingText text="https://github.com/PrimeCloudOfficial/Prime-Cloud" delay={35} onComplete={() => setShowPrompt(true)} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
      {showAdmin && (
        <AdminPanel
          onClose={() => {
            setShowAdmin(false);
            fetchConfig();
          }}
        />
      )}
    </>
  );
}
