const name = 'Network calisthenics: control of E2F dynamics in cell cycle entry';

const journalName = 'Cell Cycle';

const year = 2011;

const authorName = 'Jeff Wong';

const authorEmail = 'jvwong@gmail.com';

const editorName = 'Max Franz';

const editorEmail = 'maxkfranz@gmail.com';

const trackingId = '1234';

const abstract = `
Stimulation of quiescent mammalian cells with mitogens induces an abrupt increase in E2F1–3 expression just prior to the onset of DNA synthesis, followed by a rapid decline as replication ceases. This temporal adaptation in E2F facilitates a transient pattern of gene expression that reflects the ordered nature of DNA replication. The challenge to understand how E2F dynamics coordinate molecular events required for high-fidelity DNA replication has great biological implications. Indeed, precocious, prolonged, elevated or reduced accumulation of E2F can generate replication stress that culminates in either arrest or death. Accordingly, temporal characteristics of E2F are regulated by several network modules that include feedforward and autoregulatory loops. In this review, we discuss how these network modules contribute to “shaping” E2F dynamics in the context of mammalian cell cycle entry.
`;

const text = `
Introduction

In response to mitogenic growth stimulation, quiescent mammalian cells can re-enter the cell cycle. Successful division requires faithful and complete duplication of genomic DNA within a narrow time frame of minutes to hours. To deal with the speed and fidelity demanded of this process, eukaryotes have evolved a parallel processing strategy: replication is asynchronously initiated from a subset of several thousand genomic locations called “origins of replication” (ORI). An organizing principle of this process is temporal ordering (Fig. 1A): helicase and accessory proteins forming the pre-replication complex (pre-RC) are synthesized, ORI are “licensed” by binding to pre-RC; replication initiation of licensed ORI is triggered by phosphorylation of the pre-RC components, and licenses are removed through a combination of phosphorylation-dependent degradation, inhibition and re-localization of pre-RC machinery.1 Blow JJ, Dutta A. Preventing re-replication of chromosomal DNA. Nat Rev Mol Cell Biol 2005; 6:476 - 486; PMID: 15928711; http://dx.doi.org/10.1038/nrm1663
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,2 Arias EE, Walter JC. Strength in numbers: preventing rereplication via multiple mechanisms in eukaryotic cells. Genes Dev 2007; 21:497 - 518; PMID: 17344412; http://dx.doi.org/10.1101/gad.1508907
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Temporal coordination ensures that DNA is faithfully duplicated “once and only once” during each cell cycle. Deregulation of this process commonly results in replication stress, i.e., aberrant re-initiation and DNA breakage resulting from uncoordinated progression of replication forks,3 Branzei D, Foiani M. Maintaining genome stability at the replication fork. Nat Rev Mol Cell Biol 2010; 11:208 - 219; PMID: 20177396; http://dx.doi.org/10.1038/nrm2852
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  which has been speculated to generate the genomic instability that underlies malignant transformation.4 Halazonetis TD, Gorgoulis VG, Bartek J. An oncogene-induced DNA damage model for cancer development. Science 2008; 319:1352 - 1355; PMID: 18323444; http://dx.doi.org/10.1126/science.1140735
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]

E2F transcription factors play an integral role in coordination of DNA replication events. The first member, E2-factor 1 (E2F1), was identified through its physical association with the retinoblastoma (RB) tumor suppressor,5 Chellappan SP, Hiebert S, Mudryj M, Horowitz JM, Nevins JR. The E2F transcription factor is a cellular target for the RB protein. Cell 1991; 65:1053 - 1061; PMID: 1828392; http://dx.doi.org/10.1016/0092-8674(91)90557-F
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,6 Bagchi S, Weinmann R, Raychaudhuri P. The retinoblastoma protein copurifies with E2F-I, an E1A-regulated inhibitor of the transcription factor E2F. Cell 1991; 65:1063 - 1072; PMID: 1828393; http://dx.doi.org/10.1016/0092-8674(91)90558-G
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  which acts to sequester E2F1.7 Weintraub SJ, Prater CA, Dean DC. Retinoblastoma protein switches the E2F site from positive to negative element. Nature 1992; 358:259 - 261; PMID: 1321348; http://dx.doi.org/10.1038/358259a0
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Growth factor stimulation induces RB phosphorylation, permitting release and activation of E2F1 activity.8 Mudryj M, Hiebert SW, Nevins JR. A role for the adenovirus inducible E2F transcription factor in a proliferation dependent signal transduction pathway. EMBO J 1990; 9:2179 - 2184; PMID: 2141565
[PubMed], [Web of Science ®], [Google Scholar]
  E2F1, in association with DP1, behaves as a sequence-specific transcriptional activator of cellular genes, including those associated with growth and proliferation (e.g., c-Myc,9 Thalmeier K, Synovzik H, Mertz R, Winnacker EL, Lipp M. Nuclear factor E2F mediates basic transcription and trans-activation by E1a of the human MYC promoter. Genes Dev 1989; 3:527 - 536; PMID: 2721961; http://dx.doi.org/10.1101/gad.3.4.527
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,10 Hiebert SW, Lipp M, Nevins JR. E1A-dependent trans-activation of the human MYC promoter is mediated by the E2F factor. Proc Natl Acad Sci USA 1989; 86:3594 - 3598; PMID: 2524830; http://dx.doi.org/10.1073/pnas.86.10.3594
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Dihydrofolate reductase, c-Myb and Epidermal growth factor receptor8 Mudryj M, Hiebert SW, Nevins JR. A role for the adenovirus inducible E2F transcription factor in a proliferation dependent signal transduction pathway. EMBO J 1990; 9:2179 - 2184; PMID: 2141565
[PubMed], [Web of Science ®], [Google Scholar]
). This is consistent with observations that ectopic E2F1 stimulated DNA synthesis in quiescent cells.11 Johnson DG, Schwarz JK, Cress WD, Nevins JR. Expression of transcription factor E2F1 induces quiescent cells to enter S phase. Nature 1993; 365:349 - 352; PMID: 8377827; http://dx.doi.org/10.1038/365349a0
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
–13 Qin XQ, Livingston DM, Kaelin WG Jr, Adams PD. Deregulated transcription factor E2F-1 expression leads to S-phase entry and p53-mediated apoptosis. Proc Natl Acad Sci USA 1994; 91:10918 - 10922; PMID: 7971984; http://dx.doi.org/10.1073/pnas.91.23.10918
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  This early evidence supports the view of RB-E2F as a link between growth signals and cell cycle gene expression. Recent genome-scale measures of gene expression further revealed a role for E2F in activating not only genes at G1/S that encode DNA replication proteins, but also genes at G2/M that encode mitotic activities.

In the last two decades, eight E2F family members have been identified14 Attwooll C, Denchi EL, Helin K. The E2F family: specific functions and overlapping interests. EMBO J 2004; 23:4709 - 4716; PMID: 15538380; http://dx.doi.org/10.1038/sj.emboj.7600481
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,15 Trimarchi JM, Lees JA. Sibling rivalry in the E2F family. Nat Rev Mol Cell Biol 2002; 3:11 - 20; PMID: 11823794; http://dx.doi.org/10.1038/nrm714
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  and divided into “activators” (E2F1–3) and “repressors” (E2F4–8). While this classification implies opposing roles by the two groups, it is increasingly clear that the activities of E2Fs are context-dependent.16 Chong JL, Tsai SY, Sharma N, Opavsky R, Price R, Wu L, et al. E2f3a and E2f3b contribute to the control of cell proliferation and mouse development. Mol Cell Biol 2009; 29:414 - 424; PMID: 19015245; http://dx.doi.org/10.1128/MCB.01161-08
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,17 Chong JL, Wenzel PL, Saenz-Robles MT, Nair V, Ferrey A, Hagan JP, et al. E2f1-3 switch from activators in progenitor cells to repressors in differentiating cells. Nature 2009; 462:930 - 934; PMID: 20016602; http://dx.doi.org/10.1038/nature08677
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Regardless, the functions of various E2Fs in both normal18 DeGregori J, Johnson DG. Distinct and Overlapping Roles for E2F Family Members in Transcription, Proliferation and Apoptosis. Curr Mol Med 2006; 6:739 - 748; PMID: 17100600
[PubMed], [Web of Science ®], [Google Scholar]
  and pathological circumstances19 Nevins JR. The Rb/E2F pathway and cancer. Hum Mol Genet 2001; 10:699 - 703; PMID: 11257102; http://dx.doi.org/10.1093/hmg/10.7.699
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  have been extensively analyzed; this information has defined the “wiring diagram” of the wider RB-E2F regulatory network.20 Sears RC, Nevins JR. Signaling networks that link cell proliferation and cell fate. J Biol Chem 2002; 277:11617 - 11620; PMID: 11805123; http://dx.doi.org/10.1074/jbc.R100063200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,21 Calzone L, Gelay A, Zinovyev A, Radvanyi F, Barillot E. A comprehensive modular map of molecular interactions in RB/E2F pathway. Mol Syst Biol 2008; 4:173; PMID: 18319725; http://dx.doi.org/10.1038/msb.2008.7
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]

Our group has shown that the RB-E2F pathway plays a central role in discriminating between different types of growth stimulation. Arthur Pardee coined the term restriction point (R-point) to describe the time at which cells commit to the cell cycle by discontinuing their dependence on mitogenic stimulation.22 Pardee AB. A restriction point for control of normal animal cell proliferation. Proc Natl Acad Sci USA 1974; 71:1286 - 1290; PMID: 4524638; http://dx.doi.org/10.1073/pnas.71.4.1286
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  The R-point can enforce one of two cell states (quiescence and proliferation) in accord with environmental conditions. Consistent with this notion, we have shown that the RB-E2F network acts as a bistable switch to convert graded growth inputs into an “all-or-none” response.23 Yao G, Tan C, West M, Nevins JR, You L. Origin of bistability underlying mammalian cell cycle entry. Mol Syst Biol 2011; 7:485; PMID: 21525871; http://dx.doi.org/10.1038/msb.2011.19
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,24 Yao G, Lee TJ, Mori S, Nevins JR, You L. A bistable Rb-E2F switch underlies the restriction point. Nat Cell Biol 2008; 10:476 - 482; PMID: 18364697; http://dx.doi.org/10.1038/ncb1711
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
Further, we have shown that the RB-E2F network can discriminate between normal and aberrant growth signaling from proto-oncogenes such as c-Myc (Myc). MYC is a critical mediator of physiological growth signals that facilitates E2F expression during cell cycle entry.25 Leung JY, Ehmann GL, Giangrande PH, Nevins JR. A role for Myc in facilitating transcription activation by E2F1. Oncogene 2008; 27:4172 - 4179; PMID: 18345030; http://dx.doi.org/10.1038/onc.2008.55
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  The Myc locus is often amplified in human cancers, presumably to “short circuit” the need for external growth stimulation. In normal cells, however, overexpression of MYC fails to induce DNA replication or division,26 Leone G, DeGregori J, Sears R, Jakoi L, Nevins JR. Myc and Ras collaborate in inducing accumulation of active cyclin E/Cdk2 and E2F. Nature 1997; 387:422 - 426; PMID: 9163430; http://dx.doi.org/10.1038/387422a0
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,27 Kim S, Li Q, Dang CV, Lee LA. Induction of ribosomal genes and hepatocyte hypertrophy by adenovirus-mediated expression of c-Myc in vivo. Proc Natl Acad Sci USA 2000; 97:11198 - 11202; PMID: 11005843; http://dx.doi.org/10.1073/pnas.200372597
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  suggesting that cells can somehow respond specifically to MYC expressed in a physiological context. These differing responses are reconciled by the observation that E2F1 is only upregulated when MYC levels are within a narrow window comparable to levels achieved following growth factor stimulation.28 Wong JV, Yao G, Nevins JR, You L. Viral-Mediated Noisy Gene Expression Reveals Biphasic E2f1 Response to MYC. Mol Cell 2011; 41:275 - 285; PMID: 21292160; http://dx.doi.org/10.1016/j.molcel.2011.01.014
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]

The bistable and biphasic responses in the dose domain represent the culmination of successive temporal events initiated by growth signals. However, the temporal dynamics of E2F are equally important. In response to strong growth stimulation of quiescent cells (G0), E2F1–3 expresion will rise and peak just prior to the onset of DNA synthesis (S phase) followed by inactivation just prior to the onset of mitosis (M) (Fig. 1A). This temporal program may be pivotal in coordinating the ordered molecular events required for high-fidelity DNA replication. First, E2F controls the expression of genes that constitute the pre-RC and licensing machinery which are absent in quiescent cells; perturbing their normal temporal pattern of expression induces double-strand breaks resulting from re-replication, followed by a p53-mediated checkpoint activation.29 Vaziri C, Saxena S, Jeon Y, Lee C, Murata K, Machida Y, et al. A p53-dependent checkpoint pathway prevents rereplication. Mol Cell 2003; 11:997 - 1008; PMID: 12718885; http://dx.doi.org/10.1016/S1097-2765(03)00099-6
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Second, E2F is part of an intricate regulatory cascade that activates Cyclin A/Skp2, but in a delayed manner relative to Cyclin E. This differential temporal control presumably provides a “window of opportunity” between ORI licensing and initiation/delicensing, respectively.30 Zhang HS, Gavin M, Dahiya A, Postigo AA, Ma D, Luo RX, et al. Exit from G1 and S phase of the cell cycle is regulated by repressor complexes containing HDAC-Rb-hSWI/SNF and Rb-hSWI/SNF. Cell 2000; 101:79 - 89; PMID: 10778858; http://dx.doi.org/10.1016/S0092-8674(00)80625-X
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
–32 Coverley D, Laman H, Laskey RA. Distinct roles for cyclins E and A during DNA replication complex assembly and activation. Nat Cell Biol 2002; 4:523 - 528; PMID: 12080347; http://dx.doi.org/10.1038/ncb813
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Third, persistent levels of E2F1 are unable to drive DNA synthesis to completion in quiescent fibroblasts but, rather, trigger a p53-mediated DNA damage checkpoint.33 Kowalik TF, DeGregori J, Schwarz JK, Nevins JR. E2F1 overexpression in quiescent fibroblasts leads to induction of cellular DNA synthesis and apoptosis. J Virol 1995; 69:2491 - 2500; PMID: 7884898
[PubMed], [Web of Science ®], [Google Scholar]
  Fourth, deletion of E2f1–3 in mice did not prevent cell cycling consistent with the existence of pathways parallel to RB-E2F;34 Hansen U, Owens L, Saxena UH. Transcription factors LSF and E2Fs: tandem cyclists driving G0 to S?. Cell Cycle 2009; 8:2146 - 2151; PMID: 19556876; http://dx.doi.org/10.4161/cc.8.14.9089
[Taylor & Francis Online], [Web of Science ®], [Google Scholar]
,35 Santoni-Rugiu E, Falck J, Mailand N, Bartek J, Lukas J. Involvement of Myc activity in a G(1)/S-promoting mechanism parallel to the pRb/E2F pathway. Mol Cell Biol 2000; 20:3497 - 3509; PMID: 10779339
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  however, it did result in DNA damage attributed to replicative stress.17 Chong JL, Wenzel PL, Saenz-Robles MT, Nair V, Ferrey A, Hagan JP, et al. E2f1-3 switch from activators in progenitor cells to repressors in differentiating cells. Nature 2009; 462:930 - 934; PMID: 20016602; http://dx.doi.org/10.1038/nature08677
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Indeed, while E2F targets retain their overall expression pattern in the absence of E2f1–3, their dynamics are altered and unable to reach the same peak levels.36 Timmers C, Sharma N, Opavsky R, Maiti B, Wu L, Wu J, et al. E2f1, E2f2 and E2f3 control E2F target expression and cellular proliferation via a p53-dependent negative feedback loop. Mol Cell Biol 2007; 27:65 - 78; PMID: 17167174; http://dx.doi.org/10.1128/MCB.02147-05
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Fifth, decoupling of E2F from control mechanisms that leads to either precocious37 Pickering MT, Stadler BM, Kowalik TF. miR-17 and miR-20a temper an E2F1-induced G1 checkpoint to regulate cell cycle progression. Oncogene 2009; 28:140 - 145; PMID: 18836483; http://dx.doi.org/10.1038/onc.2008.372
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  or prolonged38 Krek W, Xu G, Livingston DM. Cyclin A-kinase regulation of E2F-1 DNA binding function underlies suppression of an S phase checkpoint. Cell 1995; 83:1149 - 1158; PMID: 8548802; http://dx.doi.org/10.1016/0092-8674(95)90141-8
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
activity triggers DNA stress and a p53-mediated checkpoint. This is reminiscent of the impact of tumor-related disruptions of the RB-E2F pathway:39 Frame FM, Rogoff HA, Pickering MT, Cress WD, Kowalik TF. E2F1 induces MRN foci formation and a cell cycle checkpoint response in human fibroblasts. Oncogene 2006; 25:3258 - 3266; PMID: 16434972; http://dx.doi.org/10.1038/sj.onc.1209352
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,40 Pickering MT, Kowalik TF. Rb inactivation leads to E2F1-mediated DNA double-strand break accumulation. Oncogene 2006; 25:746 - 755; PMID: 16186801; http://dx.doi.org/10.1038/sj.onc.1209103
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  deregulation of RB can lead to abnormal replication fork dynamics, DNA strand breakage and genomic instability.41 Bester AC, Roniger M, Oren YS, Im MM, Sarni D, Chaoat M, et al. Nucleotide deficiency promotes genomic instability in early stages of cancer development. Cell 2011; 145:435 - 446; PMID: 21529715; http://dx.doi.org/10.1016/j.cell.2011.03.044
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]

Underscoring the critical importance of the E2F temporal program, the RB-E2F network is governed by multiple layers of feedback and feedforward regulation (Fig. 1B). In this review, we summarize the regulatory mechanisms that may contribute to precise control of E2F expression and activity during cell cycle entry. We emphasize evidence from mammalian cells and the dynamics of E2F1–3 activators, since they positively correlate with replication in this context. In the future, coupling mathematical modeling and experiments will be essential for quantitative understanding of E2F temporal dynamics.

Delayed E2F: Derepression

Growth stimulation initiates a cascade of signaling events20 Sears RC, Nevins JR. Signaling networks that link cell proliferation and cell fate. J Biol Chem 2002; 277:11617 - 11620; PMID: 11805123; http://dx.doi.org/10.1074/jbc.R100063200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  that generates an early peak in MYC (<60 min) along with a late peak (∼8 h) due to changes in stability mediated by ERK and PI3K, respectively.42 Lee T, Yao G, Nevins J, You L. Sensing and integration of Erk and PI3K signals by Myc. PLOS Comput Biol 2008; 4:1000013; PMID: 18463697; http://dx.doi.org/10.1371/journal.pcbi.1000013
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
–44 Sears R, Nuckolls F, Haura E, Taya Y, Tamai K, Nevins JR. Multiple Ras-dependent phosphorylation pathways regulate Myc protein stability. Genes Dev 2000; 14:2501 - 2514; PMID: 11018017; http://dx.doi.org/10.1101/gad.836800
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Though MYC is required for transcription of E2f1–3, the rise in E2f is delayed, occurring in concert with the second peak of MYC.25 Leung JY, Ehmann GL, Giangrande PH, Nevins JR. A role for Myc in facilitating transcription activation by E2F1. Oncogene 2008; 27:4172 - 4179; PMID: 18345030; http://dx.doi.org/10.1038/onc.2008.55
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  This lag likely reflects the time required to remove complexes that otherwise silence E2F expression.

A critical aspect in E2F biology is negative regulation: E2F activators and many downstream target genes are repressed in quiescence but de-repressed during cell cycle entry (Fig. 2A). E2F1–3 are sequestered by several “pocket” proteins: retinoblastoma (RB), p107 and p130.45 Cobrinik D. Pocket proteins and cell cycle control. Oncogene 2005; 24:2796 - 2809; PMID: 15838516; http://dx.doi.org/10.1038/sj.onc.1208619
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,46 Harbour JW, Dean DC. The Rb/E2F pathway: expanding roles and emerging paradigms. Genes Dev 2000; 14:2393 - 2409; PMID: 11018009; http://dx.doi.org/10.1101/gad.813200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  RB is constitutively expressed, functioning as a bona fide tumor suppressor that is often disrupted during the genesis of many types of human cancers.47 Burkhart DL, Sage J. Cellular mechanisms of tumour suppression by the retinoblastoma gene. Nat Rev Cancer 2008; 8:671 - 682; PMID: 18650841; http://dx.doi.org/10.1038/nrc2399
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  In contrast, p107 and p130 are dominant in cycling and quiescent cells, respectively, and neither is altered in cancers despite their ability to compensate for aspects of RB function.48 Sage J, Miller AL, Perez-Mancera PA, Wysocki JM, Jacks T. Acute mutation of retinoblastoma gene function is sufficient for cell cycle re-entry. Nature 2003; 424:223 - 228; PMID: 12853964; http://dx.doi.org/10.1038/nature01764
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Extensive work has shown that phosphorylation mediated by CDKs is a primary means to alleviate pocket protein inhibition of E2F activators.49 Lundberg AS, Weinberg RA. Functional inactivation of the retinoblastoma protein requires sequential modification by at least two distinct cyclin-cdk complexes. Mol Cell Biol 1998; 18:753 - 761; PMID: 9447971
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
–51 Buchkovich K, Duffy LA, Harlow E. The retinoblastoma protein is phosphorylated during specific phases of the cell cycle. Cell 1989; 58:1097 - 1105; PMID: 2673543; http://dx.doi.org/10.1016/0092-8674(89)90508-4
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]

E2F transcription is also negatively regulated by pocket proteins. In quiescent fibroblasts, a protein complex of p130:E2F4/5 maintains low transcription of E2f1 as well as other E2F-regulated cell cycle genes (e.g., Cdc6, Myb and Cyclin A)52 Takahashi Y, Rayman JB, Dynlacht BD. Analysis of promoter binding by the E2F and pRB families in vivo: distinct E2F proteins mediate activation and repression. Genes Dev 2000; 14:804 - 816; PMID: 10766737
[PubMed], [Web of Science ®], [Google Scholar]
  through direct binding to upstream regulatory sequences. Expression silencing is achieved in part through E2F4/5:p130-mediated recruitment of histone deacetylases (HDAC) that maintain a non-permissive chromatin state.53 Rayman JB, Takahashi Y, Indjeian VB, Dannenberg JH, Catchpole S, Watson RJ, et al. E2F mediates cell cycle-dependent transcriptional repression in vivo by recruitment of an HDAC1/mSin3B corepressor complex. Genes Dev 2002; 16:933 - 947; PMID: 11959842; http://dx.doi.org/10.1101/gad.969202
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Germline deletion of both p107 and p130 expressed higher basal levels of E2F and E2F-regulated targets and were constitutively acetylated,54 Hurford RK Jr, Cobrinik D, Lee MH, Dyson N. pRB and p107/p130 are required for the regulated expression of different sets of E2F responsive genes. Genes Dev 1997; 11:1447 - 1463; PMID: 9192872; http://dx.doi.org/10.1101/gad.11.11.1447
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  confirming the notion that continual HDAC activity is required to maintain low expression from these loci.

In the presence of growth factors, p130 levels decrease sharply between 6–10 h, coincident with the increase in E2F activator mRNA levels.55 Smith EJ, Leone G, DeGregori J, Jakoi L, Nevins JR. The accumulation of an E2F-p130 transcriptional repressor distinguishes a G0 cell state from a G1 cell state. Mol Cell Biol 1996; 16:6965 - 6976; PMID: 8943352
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Decreased p130 is dependent upon CDK4,6 phosphorylation, which signals SCFSKP2-mediated ubiquitination, reducing the p130 half-life to ∼1 h.56 Tedesco D, Lukas J, Reed SI. The pRb-related protein p130 is regulated by phosphorylation-dependent proteolysis via the protein-ubiquitin ligase SCF(Skp2). Genes Dev 2002; 16:2946 - 2957; PMID: 12435635; http://dx.doi.org/10.1101/gad.1011202
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,57 Bhattacharya S, Garriga J, Calbo J, Yong T, Haines DS, Grana X. SKP2 associates with p130 and accelerates p130 ubiquitylation and degradation in human cells. Oncogene 2003; 22:2443 - 2451; PMID: 12717421; http://dx.doi.org/10.1038/sj.onc.1206339
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  In the absence of p130, which normally tethers E2F4/5 in the nucleus, E2F4 is found predominantly in the cytoplasm, thus restricting its association with gene regulatory sequences.53 Rayman JB, Takahashi Y, Indjeian VB, Dannenberg JH, Catchpole S, Watson RJ, et al. E2F mediates cell cycle-dependent transcriptional repression in vivo by recruitment of an HDAC1/mSin3B corepressor complex. Genes Dev 2002; 16:933 - 947; PMID: 11959842; http://dx.doi.org/10.1101/gad.969202
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,58 Verona R, Moberg K, Estes S, Starz M, Vernon JP, Lees JA. E2F activity is regulated by cell cycle-dependent changes in subcellular localization. Mol Cell Biol 1997; 17:7268 - 7282; PMID: 9372959
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,59 Araki K, Nakajima Y, Eto K, Ikeda MA. Distinct recruitment of E2F family members to specific E2F-binding sites mediates activation and repression of the E2F1 promoter. Oncogene 2003; 22:7632 - 7641; PMID: 14576826; http://dx.doi.org/10.1038/sj.onc.1206840
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  It is likely that the dynamics of p130 degradation (∼5 h after CDK increase) are rate limiting for subsequent stages of E2F regulation.

From OFF to ON: Positive Feedback

Johnson et al.60 Johnson DG, Ohtani K, Nevins JR. Autoregulatory control of E2F1 expression in response to positive and negative regulators of cell cycle progression. Genes Dev 1994; 8:1514 - 1525; PMID: 7958836; http://dx.doi.org/10.1101/gad.8.13.1514
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  showed that a growth regulated region of the human E2f1 gene is activated by E2F1–3, which physically associate with two consensus E2F binding sites (TTTSSCGC, where S is either a G or a C) situated in the proximal promoter.52 Takahashi Y, Rayman JB, Dynlacht BD. Analysis of promoter binding by the E2F and pRB families in vivo: distinct E2F proteins mediate activation and repression. Genes Dev 2000; 14:804 - 816; PMID: 10766737
[PubMed], [Web of Science ®], [Google Scholar]
–54 Hurford RK Jr, Cobrinik D, Lee MH, Dyson N. pRB and p107/p130 are required for the regulated expression of different sets of E2F responsive genes. Genes Dev 1997; 11:1447 - 1463; PMID: 9192872; http://dx.doi.org/10.1101/gad.11.11.1447
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Mutation of E2F binding sites simultaneously abrogated E2F protein binding and resulted in constitutively high promoter activity, consistent with a role in mediating repression by p130:E2F4/5 complexes. Further dissection of each binding site revealed subtle differences: The upstream site mediates repression, whereas the proximal site activation.59 Araki K, Nakajima Y, Eto K, Ikeda MA. Distinct recruitment of E2F family members to specific E2F-binding sites mediates activation and repression of the E2F1 promoter. Oncogene 2003; 22:7632 - 7641; PMID: 14576826; http://dx.doi.org/10.1038/sj.onc.1206840
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  The functional distinction between sites is reflected in their association with different protein complexes.53 Rayman JB, Takahashi Y, Indjeian VB, Dannenberg JH, Catchpole S, Watson RJ, et al. E2F mediates cell cycle-dependent transcriptional repression in vivo by recruitment of an HDAC1/mSin3B corepressor complex. Genes Dev 2002; 16:933 - 947; PMID: 11959842; http://dx.doi.org/10.1101/gad.969202
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  The specific role that E2F transactivation (vs. de-repression) plays in the transcriptional dynamics of E2f1–3 or other downstream targets remains to be seen.

E2f2 and E2F3a employ similar regulatory mechanisms to modulate their expression.61 Sears R, Ohtani K, Nevins JR. Identification of positively and negatively acting elements regulating expression of the E2F2 gene in response to cell growth signals. Mol Cell Biol 1997; 17:5227 - 5235; PMID: 9271400
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
–63 Adams MR, Sears R, Nuckolls F, Leone G, Nevins JR. Complex transcriptional regulatory mechanisms control expression of the E2F3 locus. Mol Cell Biol 2000; 20:3633 - 3639; PMID: 10779353; http://dx.doi.org/10.1128/MCB.20.10.3633-9.2000
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  In vivo evidence suggests cross-association between E2F activators at promoter binding sites during the exit from quiescence.52 Takahashi Y, Rayman JB, Dynlacht BD. Analysis of promoter binding by the E2F and pRB families in vivo: distinct E2F proteins mediate activation and repression. Genes Dev 2000; 14:804 - 816; PMID: 10766737
[PubMed], [Web of Science ®], [Google Scholar]
,53 Rayman JB, Takahashi Y, Indjeian VB, Dannenberg JH, Catchpole S, Watson RJ, et al. E2F mediates cell cycle-dependent transcriptional repression in vivo by recruitment of an HDAC1/mSin3B corepressor complex. Genes Dev 2002; 16:933 - 947; PMID: 11959842; http://dx.doi.org/10.1101/gad.969202
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  It remains unclear how individual E2F activators contribute to overall E2F expression. At least in terms of development, a single E2F activator can suffice.64 Tsai SY, Opavsky R, Sharma N, Wu L, Naidu S, Nolan E, et al. Mouse development with a single E2F activator. Nature 2008; 454:1137 - 1141; PMID: 18594513; http://dx.doi.org/10.1038/nature07066
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]

Another major player in positive autoregulation is Cyclin E, a regulatory subunit for CDK2, which has similar dynamics as E2F1.65 Koff A, Giordano A, Desai D, Yamashita K, Harper JW, Elledge S, et al. Formation and activation of a cyclin E-cdk2 complex during the G1 phase of the human cell cycle. Science 1992; 257:1689 - 1694; PMID: 1388288; http://dx.doi.org/10.1126/science.1388288
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,66 Dulic V, Lees E, Reed SI. Association of human cyclin E with a periodic G1-S phase protein kinase. Science 1992; 257:1958 - 1961; PMID: 1329201; http://dx.doi.org/10.1126/science.1329201
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  The activities of RB, CYCLIN E and E2F are deeply interconnected (Fig. 2A). First, as for E2f1–3, pocket proteins negatively regulate Cyclin E transcription, and their disruption leads to increased Cyclin E expression even in quiescent cells.54 Hurford RK Jr, Cobrinik D, Lee MH, Dyson N. pRB and p107/p130 are required for the regulated expression of different sets of E2F responsive genes. Genes Dev 1997; 11:1447 - 1463; PMID: 9192872; http://dx.doi.org/10.1101/gad.11.11.1447
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,67 Zerfass K, Schulze A, Spitkovsky D, Friedman V, Henglein B, Jansen-Durr P. Sequential activation of cyclin E and cyclin A gene expression by human papillomavirus type 16 E7 through sequences necessary for transformation. J Virol 1995; 69:6389 - 6399; PMID: 7666540
[PubMed], [Web of Science ®], [Google Scholar]
–69 Herrera RE, Sah VP, Williams BO, Makela TP, Weinberg RA, Jacks T. Altered cell cycle kinetics, gene expression and G1 restriction point regulation in Rb-deficient fibroblasts. Mol Cell Biol 1996; 16:2402 - 2407; PMID: 8628308
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Second, pocket proteins are phosphorylated by CYCLIN E:CDK2 complexes at the conclusion of G1, leading to disruption of their E2F binding.5 Chellappan SP, Hiebert S, Mudryj M, Horowitz JM, Nevins JR. The E2F transcription factor is a cellular target for the RB protein. Cell 1991; 65:1053 - 1061; PMID: 1828392; http://dx.doi.org/10.1016/0092-8674(91)90557-F
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Third, Cyclin E is a direct transcriptional target of E2F1; mutation of two canonical, promoter-proximal E2F binding sites results in qualitatively similar temporal dynamics in response to serum but with a premature peak and overall elevated levels.70 Ohtani K, DeGregori J, Nevins JR. Regulation of the cyclin E gene by transcription factor E2F1. Proc Natl Acad Sci USA 1995; 92:12146 - 12150; PMID: 8618861; http://dx.doi.org/10.1073/pnas.92.26.12146
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Cyclin E is essential for exit from quiescence, likely owing to its role in promoting assembly and licensing of pre-RC.71 Geng Y, Yu Q, Sicinska E, Das M, Schneider JE, Bhattacharya S, et al. Cyclin E ablation in the mouse. Cell 2003; 114:431 - 443; PMID: 12941272; http://dx.doi.org/10.1016/S0092-8674(03)00645-7
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,72 Geng Y, Lee YM, Welcker M, Swanger J, Zagozdzon A, Winer JD, et al. Kinase-independent function of cyclin E. Mol Cell 2007; 25:127 - 139; PMID: 17218276; http://dx.doi.org/10.1016/j.molcel.2006.11.029
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Moreover, constitutive expression of Cyclin E results in cell cycle arrest and chromosomal instability,73 Spruck CH, Won KA, Reed SI. Deregulated cyclin E induces chromosome instability. Nature 1999; 401:297 - 300; PMID: 10499591; http://dx.doi.org/10.1038/45836
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  underscoring the interwoven nature of positive autoregulation and DNA replication.

Another source of positive feedback involves p53. Growth stimulation and E2F activation are required to eliminate a p53-p21WAF1-mediated block in cell cycle entry in late G1.74 Sharma N, Timmers C, Trikha P, Saavedra HI, Obery A, Leone G. Control of the p53-p21CIP1 Axis by E2f1, E2f2 and E2f3 is essential for G1/S progression and cellular transformation. J Biol Chem 2006; 281:36124 - 36131; PMID: 17008321; http://dx.doi.org/10.1074/jbc.M604152200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  p21WAF1 is a transcriptional target of p53 75 El-Deiry WS, Tokino T, Velculescu VE, Levy DB, Parsons R, Trent JM, et al. WAF1, a potential mediator of p53 tumor suppression. Cell 1993; 75:817 - 825; PMID: 8242752; http://dx.doi.org/10.1016/0092-8674(93)90500-p
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  and promotes RB activity by inhibiting its phosphorylation by CDKs. One proposed link between E2F and p53 is Sirt1, which is induced by E2F1 and encodes a deacetylase that inactivates p53 activity.76 Chen D, Pacal M, Wenzel P, Knoepfler PS, Leone G, Bremner R. Division and apoptosis of E2f-deficient retinal progenitors. Nature 2009; 462:925 - 929; PMID: 20016601; http://dx.doi.org/10.1038/nature08544
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,77 Wang C, Chen L, Hou X, Li Z, Kabra N, Ma Y, et al. Interactions between E2F1 and SirT1 regulate apoptotic response to DNA damage. Nat Cell Biol 2006; 8:1025 - 1031; PMID: 16892051; http://dx.doi.org/10.1038/ncb1468
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Another possible link is the E2F-mediated induction of the Arf tumor suppressor that inactivates MDM2, a ubiquitin ligase of p53. However, it remains unclear if modulation of Arf expression and activity is cell cycle-dependent.36 Timmers C, Sharma N, Opavsky R, Maiti B, Wu L, Wu J, et al. E2f1, E2f2 and E2f3 control E2F target expression and cellular proliferation via a p53-dependent negative feedback loop. Mol Cell Biol 2007; 27:65 - 78; PMID: 17167174; http://dx.doi.org/10.1128/MCB.02147-05
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,78 Komori H, Enomoto M, Nakamura M, Iwanaga R, Ohtani K. Distinct E2F-mediated transcriptional program regulates p14ARF gene expression. EMBO J 2005; 24:3724 - 3736; PMID: 16211008; http://dx.doi.org/10.1038/sj.emboj.7600836
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,79 Mallakin A, Taneja P, Matise LA, Willingham MC, Inoue K. Expression of Dmp1 in specific differentiated, nonproliferating cells and its regulation by E2Fs. Oncogene 2006; 25:7703 - 7713; PMID: 16878159; http://dx.doi.org/10.1038/sj.onc.1209750
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Regardless of specific mechanisms, suppression of the p53-p21WAF1 axis in an E2F-dependent fashion represents an additional means to alleviate E2F sequestration by pocket proteins.

Regulation of E2F by multiple positive feedback loops is critical for the control of cell cycle entry. Positive feedback is a hallmark of bistable responses80 Ferrell JE Jr. Self-perpetuating states in signal transduction: positive feedback, double-negative feedback and bistability. Curr Opin Cell Biol 2002; 14:140 - 148; PMID: 11891111; http://dx.doi.org/10.1016/S0955-0674(02)00314-9
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
and may underlie the self-sustaining behavior of the RB-E2F network. Furthermore, coupled slow and fast positive feedback loops can generate rapid transit from the OFF to ON state yet remain noise-resistant when ON.81 Brandman O, Ferrell JE Jr, Li R, Meyer T. Interlinked fast and slow positive feedback loops drive reliable cell decisions. Science 2005; 310:496 - 498; PMID: 16239477; http://dx.doi.org/10.1126/science.1113834
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Using a synthetic mammalian gene circuit, Longo et al. demonstrated that positive feedback can reduce both the time needed to surpass basal expression levels and cell-cell variability in gene expression (Fig. 2B). These findings are similar to those gathered by our group using single-cell measurements of E2f1 expression coupled with stochastic simulations of an RB-E2F network model:83 Lee TJ, Yao G, Bennett DC, Nevins JR, You L. Stochastic E2F activation and reconciliation of phenomenological cell cycle models. PLoS Biol 2010; 8:1000488; PMID: 20877711; http://dx.doi.org/10.1371/journal.pbio.1000488
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  feedback mediated by CDK2 reduced both the minimum time for E2F to surpass a basal threshold (“time delay”) and the variability of ON-switching across a population (“transition rate”). An intriguing result of this work is the correspondence between variability in E2F activation and cell-cell variability in the time between G0 and division previously described using phenomenological models.84 Castor LNA. G1 rate model accounts for cell cycle kinetics attributed to ‘transition probability’. Nature 1980; 287:857 - 859; PMID: 6159544; http://dx.doi.org/10.1038/287857a0
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,85 Brooks RF, Bennett DC, Smith JA. Mammalian cell cycles need two random transitions. Cell 1980; 19:493 - 504; PMID: 7357616; http://dx.doi.org/10.1016/0092-8674(80)90524-3
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  This suggests that E2F dynamics may have direct consequence on both DNA replication and the rate of cell proliferation. Whether positive autoregulation arising through cross-regulation or p53 has an effect on time delay, coherence and noise in E2F or the relative contribution of each feedback loop is unclear. Importantly, how positive feedback may constrain the temporal pattern of pre-RC synthesis, assembly, loading and licensing remains to be seen.

Amplitude Modulation: Rapid Negative Feedback/Feedforward

There is a growing appreciation for the role of micro RNA (miRNA) in modulating RB-E2F activity, target genes and replication stress.86 Coller HA, Forman JJ, Legesse-Miller A. “Myc'ed messages”: myc induces transcription of E2F1 while inhibiting its translation via a microRNA polycistron. PLoS Genet 2007; 3:146; PMID: 17784791; http://dx.doi.org/10.1371/journal.pgen.0030146
[Crossref], [PubMed], [Google Scholar]
–89 Bueno MJ, Malumbres M. MicroRNAs and the cell cycle. Biochim Biophys Acta 2011; 1812:592 - 601; PMID: 21315819
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  The miR-17 cluster is regulated by both MYC and E2F. Two mature products of this locus, miR-17-5p and miR-20a, target E2F mRNA and downregulate translation.90 O'Donnell KA, Wentzel EA, Zeller KI, Dang CV, Mendell JT. c-Myc-regulated microRNAs modulate E2F1 expression. Nature 2005; 435:839 - 843; PMID: 15944709; http://dx.doi.org/10.1038/nature03677
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  The relationship between MYC, E2F and miRNA represents an incoherent feedforward loop (I1-FFL), while that between E2F and miRNA represents negative feedback91 Woods K, Thomson JM, Hammond SM. Direct regulation of an oncogenic micro-RNA cluster by E2F transcription factors. J Biol Chem 2007; 282:2130 - 2134; PMID: 17135268; http://dx.doi.org/10.1074/jbc.C600252200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,92 Sylvestre Y, Guire VD, Querido E, Mukhopadhyay UK, Bourdeau V, Major F, et al. An E2F/miR-20a autoregulatory feedback loop. J Biol Chem 2007; 282:2135 - 2143; PMID: 17135249; http://dx.doi.org/10.1074/jbc.M608939200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  (Fig. 3A).

I1-FFL can generate distinct network behaviors,93 Alon U. An introduction to systems biology: design principles of biological circuits 2007; Boca Raton, FL Chapman & Hall/CRC
  [Google Scholar]
  including adaptation,94 Ma W, Trusina A, El-Samad H, Lim WA, Tang C. Defining network topologies that can achieve biochemical adaptation. Cell 2009; 138:760 - 773; PMID: 19703401; http://dx.doi.org/10.1016/j.cell.2009.06.013
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  fold-change detection95 Ferrell JE Jr. Signaling motifs and Weber's law. Mol Cell 2009; 36:724 - 727; PMID: 20005833; http://dx.doi.org/10.1016/j.molcel.2009.11.032
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  and biphasic dose-response.96 Levchenko A, Bruck J, Sternberg PW. Regulatory modules that generate biphasic signal response in biological systems. Syst Biol (Stevenage) 2004; 1:139 - 148; PMID: 17052124; http://dx.doi.org/10.1049/sb:20045014
[Crossref], [PubMed], [Google Scholar]
–98 Kaplan S, Bren A, Dekel E, Alon U. The incoherent feed-forward loop can generate non-monotonic input functions for genes. Mol Syst Biol 2008; 4:203; PMID: 18628744; http://dx.doi.org/10.1038/msb.2008.43
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Negative feedback can generate adaptation, oscillations99 Tsai TY, Choi YS, Ma W, Pomerening JR, Tang C, Ferrell JE Jr. Robust, tunable biological oscillations from interlinked positive and negative feedback loops. Science 2008; 321:126 - 129; PMID: 18599789; http://dx.doi.org/10.1126/science.1156951
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  and expand the dynamic range of a dose-response.100 Nevozhay D, Adams RM, Murphy KF, Josic K, Balazsi G. Negative autoregulation linearizes the dose-response and suppresses the heterogeneity of gene expression. Proc Natl Acad Sci USA 2009; 106:5123 - 5128; PMID: 19279212; http://dx.doi.org/10.1073/pnas.0809901106
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
Both I1-FFL and negative feedback can increase response speed:101 Rosenfeld N, Elowitz MB, Alon U. Negative autoregulation speeds the response times of transcription networks. J Mol Biol 2002; 323:785 - 793; PMID: 12417193; http://dx.doi.org/10.1016/S0022-2836(02)00994-4
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
–103 Mangan S, Itzkovitz S, Zaslaver A, Alon U. The incoherent feed-forward loop accelerates the response-time of the gal system of Escherichia coli. J Mol Biol 2006; 356:1073 - 1081; PMID: 16406067; http://dx.doi.org/10.1016/j.jmb.2005.12.003
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
repression of steady state levels by either module can be offset through an increased production rate, which reduces the time required to achieve half-maximal levels (Fig. 3B).

Several lines of evidence suggest that repression due to miR-17 may act as a mechanism to facilitate accelerated E2F induction. First, theoretical work demonstrates that miRNA downregulates steady state E2F output.104 Aguda BD, Kim Y, Piper-Hunter MG, Friedman A, Marsh CB. MicroRNA regulation of a cancer network: consequences of the feedback loops involving miR-17-92, E2F and Myc. Proc Natl Acad Sci USA 2008; 105:19678 - 19683; PMID: 19066217; http://dx.doi.org/10.1073/pnas.0811166106
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
Second, miR-17 expression is rapid relative to E2F1–3, peaking within 1 h following growth stimulation.90 O'Donnell KA, Wentzel EA, Zeller KI, Dang CV, Mendell JT. c-Myc-regulated microRNAs modulate E2F1 expression. Nature 2005; 435:839 - 843; PMID: 15944709; http://dx.doi.org/10.1038/nature03677
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Third, once induced, levels of miR-17 are relatively stable throughout the cell cycle. These properties suggest that the miRNA functions to attenuate overall E2F levels rather than playing a role in turning E2F OFF following DNA replication. Indeed, inhibition of miR-17-5p and miR-20a in human fibroblasts by antisense RNA led to a reduction in de novo DNA synthesis arising from engagement of a p53-dependent DNA damage checkpoint.37 Pickering MT, Stadler BM, Kowalik TF. miR-17 and miR-20a temper an E2F1-induced G1 checkpoint to regulate cell cycle progression. Oncogene 2009; 28:140 - 145; PMID: 18836483; http://dx.doi.org/10.1038/onc.2008.372
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  While the overall pattern of E2F1 expression was maintained, there was precocious E2F1 induction (3–6 h) along with an increase in maximal E2F1 expression.

Like miR-17, the Arf tumor suppressor is regulated by E2F and MYC, and ARF protein can enhance proteasomal-mediated degradation of E2F.105 Datta A, Nag A, Pan W, Hay N, Gartel AL, Colamonici O, et al. Myc-ARF (alternate reading frame) interaction inhibits the functions of Myc. J Biol Chem 2004; 279:36698 - 36707; PMID: 15199070; http://dx.doi.org/10.1074/jbc.M312305200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
–111 Sherr CJ. Divorcing ARF and p53: an unsettled case. Nat Rev Cancer 2006; 6:663 - 673; PMID: 16915296; http://dx.doi.org/10.1038/nrc1954
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
However, Arf expression during the cell cycle may be context-dependent. Arf expression was described as constitutive throughout the cell cycle in rat and human cell lines stimulated by serum.78 Komori H, Enomoto M, Nakamura M, Iwanaga R, Ohtani K. Distinct E2F-mediated transcriptional program regulates p14ARF gene expression. EMBO J 2005; 24:3724 - 3736; PMID: 16211008; http://dx.doi.org/10.1038/sj.emboj.7600836
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  In contrast, serum-stimulated MEFs showed a decrease in Arf transcription during the period coincident with S phase.79 Mallakin A, Taneja P, Matise LA, Willingham MC, Inoue K. Expression of Dmp1 in specific differentiated, nonproliferating cells and its regulation by E2Fs. Oncogene 2006; 25:7703 - 7713; PMID: 16878159; http://dx.doi.org/10.1038/sj.onc.1209750
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Our work has shown that Arf is, in fact, induced in rat fibroblasts with kinetics similar to E2f1.28 Wong JV, Yao G, Nevins JR, You L. Viral-Mediated Noisy Gene Expression Reveals Biphasic E2f1 Response to MYC. Mol Cell 2011; 41:275 - 285; PMID: 21292160; http://dx.doi.org/10.1016/j.molcel.2011.01.014
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Thus, the qualitative and quantitative contribution of Arf toward E2F dynamics is unclear. It is possible that the influence of ARF may be context-dependent112 Lindström MS, Wiman KG. Myc and E2F1 induce p53 through p14ARF-independent mechanisms in human fibroblasts. Oncogene 2003; 22:4993 - 5005; PMID: 12902982; http://dx.doi.org/10.1038/sj.onc.1206659
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  or involve post-translational, cell cycle-dependent modifications rather than changes in its expression.

ON to OFF: Delayed Negative Feedback

Concurrent with the entry into S phase, E2F activity is downregulated as persistent expression of E2F1 induces apoptosis.11 Johnson DG, Schwarz JK, Cress WD, Nevins JR. Expression of transcription factor E2F1 induces quiescent cells to enter S phase. Nature 1993; 365:349 - 352; PMID: 8377827; http://dx.doi.org/10.1038/365349a0
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
–13 Qin XQ, Livingston DM, Kaelin WG Jr, Adams PD. Deregulated transcription factor E2F-1 expression leads to S-phase entry and p53-mediated apoptosis. Proc Natl Acad Sci USA 1994; 91:10918 - 10922; PMID: 7971984; http://dx.doi.org/10.1073/pnas.91.23.10918
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,33 Kowalik TF, DeGregori J, Schwarz JK, Nevins JR. E2F1 overexpression in quiescent fibroblasts leads to induction of cellular DNA synthesis and apoptosis. J Virol 1995; 69:2491 - 2500; PMID: 7884898
[PubMed], [Web of Science ®], [Google Scholar]
,113 Sun B, Wingate H, Swisher SG, Keyomarsi K, Hunt KK. Absence of pRb facilitates E2F1-induced apoptosis in breast cancer cells. Cell Cycle 2010; 9:1122 - 1130; PMID: 20237430; http://dx.doi.org/10.4161/cc.9.6.10990
[Taylor & Francis Online], [Web of Science ®], [Google Scholar]
Intuitively, abrupt suppression of E2F and licensing proteins may prevent aberrant re-initiation of replication, which otherwise triggers a cell cycle checkpoint. As discussed, rapid activation of moderate negative feedback/incoherent feedforward (e.g., miRNA) can modulate steady state levels of gene expression. On the other hand, strong delayed negative feedback permits levels of an upstream node to overshoot before it is repressed.114 Ferrell JE Jr, Tsai TY, Yang Q. Modeling the cell cycle: why do certain circuits oscillate?. Cell 2011; 144:874 - 885; PMID: 21414480; http://dx.doi.org/10.1016/j.cell.2011.03.006
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Multiple sources of delayed negative feedback may play a role in quenching E2F activity following S-phase entry.

CYCLIN A:CDK2 activity is essential for DNA replication.115 Girard F, Strausfeld U, Fernandez A, Lamb NJ. Cyclin A is required for the onset of DNA replication in mammalian fibroblasts. Cell 1991; 67:1169 - 1179; PMID: 1836977; http://dx.doi.org/10.1016/0092-8674(91)90293-8
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Similar to Cyclin E, the transcription of Cyclin A is growth regulated and under negative control through E2F binding sites.116 Schulze A, Zerfass K, Spitkovsky D, Middendorp S, Berges J, Helin K, et al. Cell cycle regulation of the cyclin A gene promoter is mediated by a variant E2F site. Proc Natl Acad Sci USA 1995; 92:11264 - 11268; PMID: 7479977; http://dx.doi.org/10.1073/pnas.92.24.11264
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Importantly, Cyclin A expression is delayed relative to E2F and Cyclin E,36 Timmers C, Sharma N, Opavsky R, Maiti B, Wu L, Wu J, et al. E2f1, E2f2 and E2f3 control E2F target expression and cellular proliferation via a p53-dependent negative feedback loop. Mol Cell Biol 2007; 27:65 - 78; PMID: 17167174; http://dx.doi.org/10.1128/MCB.02147-05
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,117 Lauper N, Beck AR, Cariou S, Richman L, Hofmann K, Reith W, et al. Cyclin E2: a novel CDK2 partner in the late G1 and S phases of the mammalian cell cycle. Oncogene 1998; 17:2637 - 2643; PMID: 9840927; http://dx.doi.org/10.1038/sj.onc.1202477
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  and temporal staggering is enforced at both the transcriptional30 Zhang HS, Gavin M, Dahiya A, Postigo AA, Ma D, Luo RX, et al. Exit from G1 and S phase of the cell cycle is regulated by repressor complexes containing HDAC-Rb-hSWI/SNF and Rb-hSWI/SNF. Cell 2000; 101:79 - 89; PMID: 10778858; http://dx.doi.org/10.1016/S0092-8674(00)80625-X
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  and post-translational levels.31 Mailand N, Diffley JF. CDKs promote DNA replication origin licensing in human cells by protecting Cdc6 from APC/C-dependent proteolysis. Cell 2005; 122:915 - 926; PMID: 16153703; http://dx.doi.org/10.1016/j.cell.2005.08.013
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  These successive interactions have a functional role in allowing pre-RC assembly (Cyclin E) to precede replication initiation and delicensing (Cyclin A).32 Coverley D, Laman H, Laskey RA. Distinct roles for cyclins E and A during DNA replication complex assembly and activation. Nat Cell Biol 2002; 4:523 - 528; PMID: 12080347; http://dx.doi.org/10.1038/ncb813
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
CYCLIN A also downregulates E2F DNA binding by phosphorylating and inhibiting the obligate DNA binding partner, DP.118 Xu M, Sheppard KA, Peng CY, Yee AS, Piwnica-Worms H. Cyclin A/CDK2 binds directly to E2F-1 and inhibits the DNA-binding activity of E2F-1/DP-1 by phosphorylation. Mol Cell Biol 1994; 14:8420 - 8431; PMID: 7969176
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,119 Krek W, Ewen ME, Shirodkar S, Arany Z, Kaelin WG Jr, Livingston DM. Negative regulation of the growth-promoting transcription factor E2F-1 by a stably bound cyclin A-dependent protein kinase. Cell 1994; 78:161 - 172; PMID: 8033208; http://dx.doi.org/10.1016/0092-8674(94)90582-7
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Prolonged DNA binding activity of an E2F1 mutant resistant to CYCLIN A:CDK2 triggers a DNA damage checkpoint in conjunction with apoptosis.38 Krek W, Xu G, Livingston DM. Cyclin A-kinase regulation of E2F-1 DNA binding function underlies suppression of an S phase checkpoint. Cell 1995; 83:1149 - 1158; PMID: 8548802; http://dx.doi.org/10.1016/0092-8674(95)90141-8
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  A subtle observation is that both E2F1 and E2F3 are required for cell cycle entry,120 Kong LJ, Chang JT, Bild AH, Nevins JR. Compensation and specificity of function within the E2F family. Oncogene 2007; 26:321 - 327; PMID: 16909124; http://dx.doi.org/10.1038/sj.onc.1209817
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  but in subsequent cell cycles, only E2F3 binding activity is required.121 Leone G, DeGregori J, Yan Z, Jakoi L, Ishida S, Williams RS, et al. E2F3 activity is regulated during the cell cycle and is required for the induction of S phase. Genes Dev 1998; 12:2120 - 2130; PMID: 9679057; http://dx.doi.org/10.1101/gad.12.14.2120
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  The mechanism and significance of this selectivity is unclear. It will be important to understand how precisely prolonged or unscheduled E2F DNA binding activity (i.e., E2F1 during subsequent cell cycles) impacts the operation of the DNA replication machinery.

E2F protein stability is modulated through ubiquitin-mediated proteasomal degradation.122 Ohta T, Xiong Y. Phosphorylation- and Skp1-independent in vitro ubiquitination of E2F1 by multiple ROC-cullin ligases. Cancer Res 2001; 61:1347 - 1353; PMID: 11245432
[PubMed], [Web of Science ®], [Google Scholar]
–124 Campanero MR, Flemington EK. Regulation of E2F through ubiquitin-proteasome-dependent degradation: stabilization by the pRB tumor suppressor protein. Proc Natl Acad Sci USA 1997; 94:2221 - 2226; PMID: 9122175; http://dx.doi.org/10.1073/pnas.94.6.2221
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  E2F1 directly activates transcription of Skp2 gene,125 Zhang L, Wang C. F-box protein Skp2: a novel transcriptional target of E2F. Oncogene 2006; 25:2615 - 2627; PMID: 16331253; http://dx.doi.org/10.1038/sj.onc.1209286
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  which encodes a subunit of the SCFSKP2 ubiquitin ligase that targets E2Fs for destruction.126 Marti A, Wirbelauer C, Scheffner M, Krek W. Interaction between ubiquitin-protein ligase SCFSKP2 and E2F-1 underlies the regulation of E2F-1 degradation. Nat Cell Biol 1999; 1:14 - 19; PMID: 10559858; http://dx.doi.org/10.1038/8984
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Changes in SKP2 levels are cell cycle-dependent and, importantly, are delayed with respect to E2F1 through a mechanism similar to the one leading to delayed increase in Cyclin A.127 Bashir T, Dorrello NV, Amador V, Guardavaccaro D, Pagano M. Control of the SCF(Skp2-Cks1) ubiquitin ligase by the APC/C(Cdh1) ubiquitin ligase. Nature 2004; 428:190 - 193; PMID: 15014502; http://dx.doi.org/10.1038/nature02330
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
Moreover, SKP2 exists in a protein complex with CYCLIN A:CDK2 and is required for its ability to promote DNA replication.127 Bashir T, Dorrello NV, Amador V, Guardavaccaro D, Pagano M. Control of the SCF(Skp2-Cks1) ubiquitin ligase by the APC/C(Cdh1) ubiquitin ligase. Nature 2004; 428:190 - 193; PMID: 15014502; http://dx.doi.org/10.1038/nature02330
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,128 Zhang H, Kobayashi R, Galaktionov K, Beach D. p19Skp1 and p45Skp2 are essential elements of the cyclin A-CDK2 S phase kinase. Cell 1995; 82:915 - 925; PMID: 7553852; http://dx.doi.org/10.1016/0092-8674(95)90271-6
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  This physical coupling may represent a way to integrate the initiation and delicensing machinery, potentially minimizing the window of time in which aberrant re-initiation may occur. Thus, in addition to its role in replication, delayed negative feedback from CYCLIN A/SKP2 downregulates E2F, underscoring the inextricable coupling of negative feedback and DNA replication events.

Another source of negative feedback involves E2F7 and E2F8, the most distantly related members of the E2F family.129 Maiti B, Li J, de Bruin A, Gordon F, Timmers C, Opavsky R, et al. Cloning and characterization of mouse E2F8, a novel mammalian E2F family member capable of blocking cellular proliferation. J Biol Chem 2005; 280:18211 - 18220; PMID: 15722552; http://dx.doi.org/10.1074/jbc.M501410200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
,130 de Bruin A, Maiti B, Jakoi L, Timmers C, Buerki R, Leone G. Identification and characterization of E2F7, a novel mammalian E2F family member capable of blocking cellular proliferation. J Biol Chem 2003; 278:42041 - 42049; PMID: 12893818; http://dx.doi.org/10.1074/jbc.M308105200
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  Although they can form homo- and heterodimers on E2F DNA binding sites, E2F7/8 do not interact with DP proteins, and their expression is delayed, rising at the conclusion of S phase. Work by Li et al.131 Li J, Ran C, Li E, Gordon F, Comstock G, Siddiqui H, et al. Synergistic function of E2F7 and E2F8 is essential for cell survival and embryonic development. Dev Cell 2008; 14:62 - 75; PMID: 18194653; http://dx.doi.org/10.1016/j.devcel.2007.10.017
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  found that these genes are direct targets of E2F1, and germline disruption of E2f7/8 led to both higher and prolonged levels of E2f1 mRNA beginning at S phase. Deletion of E2f7/8 was accompanied by massive apoptosis that was dependent upon the presence of intact E2f1 and p53. These observations were initially surprising, because downregulation of E2f1 was fully dependent upon E2f7/8 despite the presence of Cyclin A and Skp2.132 Moon NS, Dyson N. E2F7 and E2F8 keep the E2F family in balance. Dev Cell 2008; 14:1 - 3; PMID: 18194644; http://dx.doi.org/10.1016/j.devcel.2007.12.017
[Crossref], [PubMed], [Web of Science ®], [Google Scholar]
  However, this could be expected in light of the fact that E2F7/8 target transcription, while CYCLIN A/SKP2 act at the post-translational level, although the presence of positive feedback complicates this interpretation. These sorts of discrepancies emphasize the need to understand how different regulatory modules impact E2F at both the transcriptional and post-transcriptional level.

A Quantitative Framework of E2F Dynamics

We have presented evidence indicating that E2F dynamics encode information from growth signals, enabling the coordinated activity of cell cycle modules involved in DNA replication. A framework to describe the quantitative relationship between E2F dynamics and the replication machinery would aid in determining how coordination is specifically achieved and ways it can become deregulated. Two important challenges lie ahead in this regard. First is the development of an experimental platform sensitive enough to detect endogenous levels of multiple genes in individual cells with high temporal resolution. For the most part, observations of E2F dynamics have been made using population-average methods that mask cell-cell differences likely to have profound phenotypic consequences. A second challenge is the development of appropriate modeling tools, such as stochastic differential equations (SDEs), that can both describe overall network behavior and capture the cell-cell variability in gene expression. A development cycle involving modeling and quantitative experiments provides a synergistic platform for both refining model parameters (based upon experimental measurements) and making testable predictions (using model simulations) about how genetic or environmental perturbations may deregulate network function. Quantitative frameworks will be invaluable for the systematic investigation of E2F function in normal and pathological circumstances. Ultimately, it may provide opportunities for the rational design of targeted cancer therapeutics aimed at quantitative modulation of network behavior.
`;

const legends = `
Figure 1 Temporal correspondence between DNA replication and E2F. (A) (Top) Overview of successive temporal events in DNA replication. Gene products regulated by E2Fs are shown in blue. The licensed pre-replication complex (pre-RC) contains CYCLIN E, ORC, CDC6, CDT1 and MCM situated at origins of replication (ORI). Initiation involves MYC and CYCLIN A:CDK-mediated activation of pre-RC helicase activity. Delicensing occurs through inhibition of CDT1 by protein sequestration by GEMININ along with SKP2 and PCNA-mediated ubiquitination. A temporal delay between CYCLIN E- and CYCLIN A-associated CDK activity is mediated by APC/CCDH1. APC/C, anaphase-promoting complex/cyclosome with CDH1; GEM, GEMININ; ORC, origin recognition complex; CYC, CYCLIN complexed with cyclin-dependent kinase (CDK); MCM, minichromsome maintenance proteins 2–7; Pol, DNA polymerase. (Bottom) Typical temporal pattern for E2F activators (E2F1–3) as cells re-enter the cell cycle from quiescence (G0) following growth factor stimulation. The temporal dynamics summarized in this review are indicated: (1) Delayed E2F increase relative to immediate early genes; (2) switching OFF to ON; (3) amplitude modulation and (4) switching ON to OFF. (B) (Left) Genes induced by E2F1–3 and their associated network modules. (Right) Overview of network logic involving modules of the RB-E2F network. IN, upstream signals originating from growth factor signaling and MYC.
`;


module.exports = {
  name,
  journalName,
  year,
  authorName,
  authorEmail,
  editorName,
  editorEmail,
  trackingId,
  abstract,
  text,
  legends
};