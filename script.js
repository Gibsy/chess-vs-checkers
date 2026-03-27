const WHITE='white', BLACK='black', CHESS='chess', CHECKERS='checkers';
const SYMS={white:{K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙'},black:{K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'}};
let G={};

window.onload = initGame;

function initGame(){
  const playerIsChess = Math.random()>0.5;
  const playerColor   = Math.random()>0.5 ? WHITE : BLACK;
  const botColor      = playerColor===WHITE ? BLACK : WHITE;

  G={
    board: Array(8).fill(null).map(()=>Array(8).fill(null)),
    turn: WHITE,
    playerColor, botColor,
    playerGame: playerIsChess ? CHESS : CHECKERS,
    botGame:    playerIsChess ? CHECKERS : CHESS,
    sel: null, moves: [], mustCapture: false, gameOver: false
  };

  const chessColor    = playerIsChess ? playerColor : botColor;
  const checkersColor = playerIsChess ? botColor : playerColor;
  const chessBottom   = chessColor===WHITE;

  if(chessBottom) placeChess(7,6,WHITE); else placeChess(0,1,BLACK);
  placeCheckers(chessBottom ? [0,1,2] : [5,6,7], checkersColor);

  render();
  if(G.turn!==G.playerColor) setTimeout(botMove,1000);
}

function placeChess(backRow,pawnRow,color){
  ['R','N','B','Q','K','B','N','R'].forEach((t,c)=>{ G.board[backRow][c]={g:CHESS,c:color,t}; });
  for(let c=0;c<8;c++) G.board[pawnRow][c]={g:CHESS,c:color,t:'P'};
}

function placeCheckers(rows,color){
  rows.forEach(r=>{ for(let c=0;c<8;c++) if((r+c)%2===1) G.board[r][c]={g:CHECKERS,c:color,t:'C',k:false}; });
}

function render(){
  const b=document.getElementById('board');
  b.innerHTML='';
  const rows=G.playerColor===WHITE?[0,1,2,3,4,5,6,7]:[7,6,5,4,3,2,1,0];
  const cols=G.playerColor===WHITE?[0,1,2,3,4,5,6,7]:[7,6,5,4,3,2,1,0];

  for(let r of rows) {
    for(let c of cols){
      const sq=document.createElement('div');
      sq.className=`square ${(r+c)%2===0?'light':'dark'}`;
      sq.id = `sq-${r}-${c}`;
      if(G.sel?.r===r && G.sel?.c===c) sq.classList.add('selected');
      const mv=G.moves.find(m=>m.r===r&&m.c===c);
      if(mv){ sq.classList.add('possible'); if(mv.cap) sq.classList.add('possible-cap'); }

      const p=G.board[r][c];
      if(p){
        const el=document.createElement('div');
        if(p.g===CHESS){
          el.className='piece';
          el.style.color=p.c===WHITE?'#fff':'#111';
          el.style.textShadow=p.c===WHITE?'0 0 2px #000':'0 0 2px #ccc';
          el.innerHTML=SYMS[p.c][p.t];
        } else {
          el.className=`checker ${p.c}${p.k?' king':''}`;
          if(p.k) el.innerHTML='★';
        }
        sq.appendChild(el);
      }
      sq.onclick=()=>handleClick(r,c);
      b.appendChild(sq);
    }
  }

  const s=document.getElementById('status');
  if(G.gameOver) { s.style.color='#ff0'; }
  else if(G.turn===G.playerColor){ s.innerText=G.mustCapture?'MUST_CAPTURE':'YOUR_TURN'; s.style.color=G.mustCapture?'#f80':'#0f0'; }
  else { s.innerText='BOT_THINKING'; s.style.color='#f44'; }
}

function handleClick(r,c){
  if(G.turn!==G.playerColor||G.gameOver) return;
  const mv=G.moves.find(m=>m.r===r&&m.c===c);
  if(mv){ execMove(G.sel.r,G.sel.c,r,c,mv.cap); return; }
  const p=G.board[r][c];
  if(p&&p.c===G.turn&&p.g===G.playerGame){
    const moves=getMovesFor(r,c,G.board);
    if(G.mustCapture&&!moves.some(m=>m.cap)){ G.sel=null; G.moves=[]; render(); return; }
    G.sel={r,c};
    G.moves=G.mustCapture?moves.filter(m=>m.cap):moves;
    render();
  }
}

function getMovesFor(r,c,b){ 
  const p=b[r][c]; 
  if(!p) return []; 
  return p.g===CHESS ? getChessMoves(r,c,b) : getCheckerMoves(r,c,b); 
}

function getChessMoves(r,c,b){
  const p=b[r][c],mv=[];
  if(p.t==='P'){
    const d=p.c===WHITE?-1:1;
    if(inB(r+d,c)&&!b[r+d][c]){ mv.push({r:r+d,c}); const sr=p.c===WHITE?6:1; if(r===sr&&!b[r+2*d][c]) mv.push({r:r+2*d,c}); }
    for(const dc of[-1,1]){ const tr=r+d,tc=c+dc; if(inB(tr,tc)&&b[tr][tc]&&b[tr][tc].c!==p.c) mv.push({r:tr,c:tc}); }
  } else if(p.t==='N'){
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>{ const tr=r+dr,tc=c+dc; if(inB(tr,tc)&&b[tr][tc]?.c!==p.c) mv.push({r:tr,c:tc}); });
  } else {
    let dirs=[];
    if(p.t==='R'||p.t==='Q'||p.t==='K') dirs.push(...[[1,0],[-1,0],[0,1],[0,-1]]);
    if(p.t==='B'||p.t==='Q'||p.t==='K') dirs.push(...[[1,1],[1,-1],[-1,1],[-1,-1]]);
    const sl=p.t!=='K';
    dirs.forEach(([dr,dc])=>{ let nr=r+dr,nc=c+dc; while(inB(nr,nc)){ if(b[nr][nc]){ if(b[nr][nc].c!==p.c) mv.push({r:nr,c:nc}); break; } mv.push({r:nr,c:nc}); if(!sl) break; nr+=dr;nc+=dc; } });
  }
  return mv;
}

function getCheckerMoves(r,c,b){
  const p=b[r][c], mv=[];
  if(!p.k){
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>{ 
      const er=r+dr, ec=c+dc, lr=r+dr*2, lc=c+dc*2; 
      if(inB(er,ec)&&inB(lr,lc)&&b[er][ec]&&b[er][ec].c!==p.c&&!b[lr][lc]) mv.push({r:lr,c:lc,cap:{r:er,c:ec}}); 
    });
  } else {
    const dirs = [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
    dirs.forEach(([dr,dc])=>{ 
      let nr=r+dr, nc=c+dc, found=null; 
      while(inB(nr,nc)){ 
        const t=b[nr][nc]; 
        if(found){ if(t) break; mv.push({r:nr,c:nc,cap:found}); } 
        else { if(t){ if(t.c===p.c) break; found={r:nr,c:nc}; } else { mv.push({r:nr,c:nc}); } } 
        nr+=dr; nc+=dc; 
      } 
    });
  }
  if(mv.some(m => m.cap)) return mv.filter(m => m.cap);
  if(!p.k){ 
    const fwd=p.c===WHITE?-1:1; 
    for(const dc of[-1,1]){ const nr=r+fwd, nc=c+dc; if(inB(nr,nc)&&!b[nr][nc]) mv.push({r:nr,c:nc}); } 
  }
  return mv;
}

function hasMandatoryCapture(color,game,board){ for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p&&p.c===color&&p.g===game&&getMovesFor(r,c,board).some(m=>m.cap)) return true; } return false; }
function inB(r,c){ return r>=0&&r<8&&c>=0&&c<8; }

function execMove(fr, fc, tr, tc, cap) {
  if(G.gameOver) return;
  const p = G.board[fr][fc];
  
  if (cap) {
    const victimSq = document.getElementById(`sq-${cap.r}-${cap.c}`);
    const victimEl = victimSq ? victimSq.querySelector('.piece, .checker') : null;
    if (victimEl) victimEl.classList.add('capturing');
    G.board[cap.r][cap.c] = null; 
  }

  G.board[tr][tc] = p;
  G.board[fr][fc] = null;

  if (p.g === CHECKERS) { 
    const pr = p.c === WHITE ? 0 : 7; 
    if (tr === pr) p.k = true; 
  }
  if (p.g === CHESS && p.t === 'P' && (tr === 0 || tr === 7)) p.t = 'Q';

  if (p.g === CHECKERS && cap) {
    const more = getCheckerMoves(tr, tc, G.board).filter(m => m.cap);
    if (more.length > 0) {
      setTimeout(() => {
        if (G.turn === G.playerColor) { 
          G.sel = { r: tr, c: tc }; 
          G.moves = more; 
          G.mustCapture = true; 
          render(); 
        } else { 
          const pk = more[Math.floor(Math.random() * more.length)]; 
          execMove(tr, tc, pk.r, pk.c, pk.cap); 
        }
      }, 450);
      return;
    }
  }

  G.sel = null; 
  G.moves = [];
  G.turn = G.turn === WHITE ? BLACK : WHITE;
  
  const ng = G.turn === G.playerColor ? G.playerGame : G.botGame;
  G.mustCapture = hasMandatoryCapture(G.turn, ng, G.board);

  setTimeout(() => {
    if (checkWin()) return;
    render();
    if (G.turn !== G.playerColor) setTimeout(botMove, 600);
  }, cap ? 400 : 50);
}

function checkWin(){
  let kingFound = false, checkersFound = false, chessPiecesFound = false;
  for(let r=0; r<8; r++){
    for(let c=0; c<8; c++){
      const p = G.board[r][c];
      if(p){
        if(p.g === CHESS){
          chessPiecesFound = true;
          if(p.t === 'K') kingFound = true;
        } else { checkersFound = true; }
      }
    }
  }

  const s = document.getElementById('status');
  if(!kingFound && chessPiecesFound){
    G.gameOver = true;
    s.innerText = 'KING CAPTURED! CHECKERS WIN';
    render(); return true;
  }
  if(!chessPiecesFound || !checkersFound){
    G.gameOver = true;
    s.innerText = !chessPiecesFound ? 'CHECKERS WIN!' : 'CHESS WIN!';
    render(); return true;
  }
  return false;
}

function botMove(){
  if(G.gameOver) return;
  let all=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){ 
    const p=G.board[r][c]; 
    if(p&&p.c===G.turn&&p.g===G.botGame) getMovesFor(r,c,G.board).forEach(m=>all.push({fr:r,fc:c,...m})); 
  }
  const caps=all.filter(m=>m.cap); if(caps.length>0) all=caps;
  if(!all.length){ G.gameOver=true; render(); return; }
  
  const diff=document.getElementById('diff').value;
  let pick;
  if(diff==='1'){ pick=all[Math.floor(Math.random()*all.length)]; }
  else {
    const scored=all.map(m=>{ 
      let s=0; 
      const t=G.board[m.r][m.c]||(m.cap?G.board[m.cap.r][m.cap.c]:null); 
      if(t) s+=t.t==='Q'?9:t.t==='R'?5:t.t==='B'||t.t==='N'?3:1; 
      return {...m,score:s}; 
    });
    scored.sort((a,b)=>b.score-a.score);
    const top = scored.slice(0,Math.min(3,scored.length));
    pick=top[Math.floor(Math.random()*top.length)];
  }
  execMove(pick.fr,pick.fc,pick.r,pick.c,pick.cap);
}
