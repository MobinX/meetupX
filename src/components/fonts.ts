import localFont from 'next/font/local'
 
// Font files can be colocated inside of `app`
export const  curvedFont = localFont({
  src: './androgyne.otf',
  display: 'swap',
  variable: '--font-androgyne',
})