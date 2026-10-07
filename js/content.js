// ============================================================================
//  EDIT ME — the numbers and people shown on the website live in this file.
//
//  To change something: edit the text between the quotes, save, and the site
//  updates in about a minute. Keep every quote ' ' and comma , in place.
//
//  Add a person:   copy one whole line  { name: '...', role: '...' },  paste it
//                  under the others in the same group, then change the words.
//  Remove one:     delete that person's line.
//  Add a bio:      add   bio: 'Short paragraph…'   inside the braces (optional).
//  Add a group:    copy a whole  { title: '...', people: [ ... ] },  block.
//  Same idea for the impact numbers at the top.
//
//  If a section on the site goes blank, a comma or quote went missing here.
// ============================================================================

window.CONTENT = {

  // Home page → "What we have built together". number = plain digits, suffix = text after it (+, %, …)
  stats: [
    { number: 450, suffix: '+', label: 'Youth trained in skill development' },
    { number: 200, suffix: '+', label: 'Farmers transitioned to organic farming' },
    { number: 50,  suffix: '+', label: 'Villages with Child Rights Clubs' },
    { number: 500, suffix: '+', label: 'SC/ST youth trained' },
    { number: 100, suffix: '+', label: 'Healthcare (GDA) trainees since 2020' },
    { number: 300, suffix: '+', label: 'Women trained in trades & enterprise' },
    { number: 450, suffix: '+', label: 'Women entrepreneurs supported' },
    { number: 14,  suffix: '',  label: 'Districts covered across Tamil Nadu' },
    { number: 13,  suffix: '+', label: 'Years of operation' },
  ],

  // About page → "The minds behind our mission". Groups appear in this order.
  team: [
    {
      title: 'Board Members',
      people: [
        { name: 'Mrs. Grace Pramilan', role: 'Managing Trustee' },
        { name: 'Josephine',           role: 'Secretary' },
        { name: 'Mr. Thangaraj',       role: 'Treasurer' },
        { name: 'Mr. Sampath',         role: 'Trustee' },
        { name: 'Mr. Kalaiselvi',      role: 'Trustee' },
      ],
    },
    {
      title: 'Advisory Committee',
      people: [
        { name: 'Selvanathan',     role: 'MSW' },
        { name: 'Issac Pramilan',  role: 'Advisor' },
        { name: 'A. Vimala',       role: 'RTD TR' },
        { name: 'Murugeshwaran',   role: 'M.E' },      ],
    },
    {
      title: 'Consultant Team',
      people: [
        { name: 'Dr. Vijayalakshmi', role: 'PhD' },
        { name: 'Dr. Vimudha',       role: 'Consultant' },
        { name: 'Dr. Deepak',        role: 'CN' },
        { name: 'Mr. N. Anandhan',   role: 'MSW' },
      ],
    },
  ],
};
