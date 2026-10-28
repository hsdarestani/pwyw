/* Progressive enhancement: password visibility with localized accessible state. */
(()=>{'use strict';
 const input=document.querySelector('#auth-form input[name=password]');
 if(!input)return;
 const wrapper=document.createElement('span');wrapper.className='pw4-password-wrap';
 input.before(wrapper);wrapper.append(input);
 const button=document.createElement('button');button.type='button';button.className='pw4-password-toggle';
 button.setAttribute('aria-controls',input.id||'pw4-auth-password');
 if(!input.id)input.id='pw4-auth-password';
 wrapper.append(button);
 const fa=()=>window.PWYWI18N?.locale?.()==='fa'||document.documentElement.lang==='fa';
 function render(){
  const visible=input.type==='text';
  button.textContent=fa()?(visible?'پنهان':'نمایش'):(visible?'Verbergen':'Anzeigen');
  button.setAttribute('aria-label',fa()?(visible?'پنهان‌کردن رمز عبور':'نمایش رمز عبور'):(visible?'Passwort verbergen':'Passwort anzeigen'));
  button.setAttribute('aria-pressed',String(visible));
 }
 button.addEventListener('click',()=>{
  const selectionStart=input.selectionStart,selectionEnd=input.selectionEnd;
  input.type=input.type==='password'?'text':'password';
  render();input.focus({preventScroll:true});
  try{input.setSelectionRange(selectionStart,selectionEnd)}catch{}
 });
 document.addEventListener('pwyw:language-changed',render);
 render();
})();
