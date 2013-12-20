import csv
import json
import codecs

brfsscsv = csv.DictReader(open('brfss-adj.csv','rU'))

def mapVal(value, srcLow, srcHigh, dstLow, dstHigh):
    # value is outside source range return fail
    if value < srcLow or value > srcHigh:
        return 0

    srcMax = srcHigh - srcLow
    dstMax = dstHigh - dstLow
    adjValue = value - srcLow

    return (adjValue * dstMax / srcMax) + dstLow

brfss = {}
meta = {'d':{}}

labels = {
    'bingeDrinking': 'Binge Drinking',
    'smoking': 'Smoking',
    'excessDrinking': 'Excessive Drinking',
    'poorHealth': 'Fair or Poor Health',
    'noExercise': 'No Exercise',
    'obesity': 'Obesity',
    'phyisicianUseDelay': 'Delay Seeing a Doctor',
    'socEmoSupport': 'Social-Emotional Support Lacking',
    'firearmDeaths': 'Firearm Deaths',
    'nonFirearmDeaths': 'Non-Firearm Deaths',
    'totAvg': 'Mortality Attitude Index'
}

quest = {
    'bingeDrinking': 'Considering all types of alcoholic beverages, how many times during the past 30 days did you have [5 for men, 4 for women] or more drinks on an occasion?',
    'smoking': 'Do you now smoke cigarettes every day, some days, or not at all?',
    'excessDrinking': 'One drink is equivalent to a 12-ounce beer, a 5-ounce glass of wine, or a drink with one shot of liquor. During the past 30 days, on the days when you drank, about how many drinks did you drink on the average?',
    'poorHealth': 'Would you say that in general your health is: Excellent, Very good, Good, Fair, Or Poor?',
    'noExercise': 'During the past month, other than your regular job, did you participate in any physical activities or exercises such as running, calisthenics, golf, gardening, or walking for exercise?',
    'obesity': 'About how much do you weigh without shoes? (and) About how tall are you without shoes?',
    'phyisicianUseDelay': 'Was there a time in the past 12 months when you needed to see a doctor but could not because of cost?',
    'socEmoSupport': 'Social-Emotional Support Lacking',
    'firearmDeaths': '',
    'nonFirearmDeaths': '',
    'totAvg': 'A high number indicates a low value of life, a low number indicates a high value.'
}

descs = {
    'bingeDrinking': 'Respondents who report having 5+ (men) or 4+ (women) drinks on one or more occasions during the previous 30 days. (2005-2011)',
    'smoking': 'Respondents who report smoking cigarettes all or some days. (2005-2011)',
    'excessDrinking': 'Respondents who drank >2 (men) or >1 (women) drinks per day on average or who drank 5+ (men) or 4+ (women) drinks during a single occasion. (2005-2011)',
    'poorHealth': 'Respondents with self-reported fair or poor health status. (2005-2011)',
    'noExercise': 'Respondents who report no exercise in past month. (2005-2011)',
    'obesity': 'Respondents aged 18+ years who have a body mass index (BMI) >=30.0 kg/m<sup>2</sup> calculated from self-reported weight and height. (2005-2011)',
    'phyisicianUseDelay': 'Respondents who needed to see a doctor but could not because of cost in the past 12 months. (2005-2011)',
    'socEmoSupport': 'Respondents who report inadequate emotional support. (2005-2011)',
    'firearmDeaths': 'Violence-related Firearm Death Rates per 100,000 pop. (2004-2010)',
    'nonFirearmDeaths': 'Non-Firearm Violence-related Firearm Death Rates per 100,000 pop. (2004-2010)',
    'totAvg': 'Data derived from collecting all of the non-undefined risk factor indices, and creating an "average" index of basic societal attitudes towards risk factors and preventative mortality risks.'
}

sources = {
    'bingeDrinking': 'Behavioral Risk Factor Surveillance System (BRFSS) (CDC/PHSPO)',
    'smoking': 'Behavioral Risk Factor Surveillance System (BRFSS) (CDC/PHSPO)',
    'excessDrinking': 'Behavioral Risk Factor Surveillance System (BRFSS) (CDC/PHSPO)',
    'poorHealth': 'Behavioral Risk Factor Surveillance System (BRFSS) (CDC/PHSPO)',
    'noExercise': 'Behavioral Risk Factor Surveillance System (BRFSS) (CDC/PHSPO)',
    'obesity': 'Behavioral Risk Factor Surveillance System (BRFSS) (CDC/PHSPO)',
    'phyisicianUseDelay': 'Behavioral Risk Factor Surveillance System (BRFSS) (CDC/PHSPO)',
    'socEmoSupport': 'Behavioral Risk Factor Surveillance System (BRFSS) (CDC/PHSPO)',
    'firearmDeaths': 'Centers for Disease Control and Prevention, National Center for Injury Prevention and Control, Statistics, Programming and Economics Branch',
    'nonFirearmDeaths': 'Centers for Disease Control and Prevention, National Center for Injury Prevention and Control, Statistics, Programming and Economics Branch',
    'totAvg': 'Various BRFSS/CDC/PHSPO'
}

colors = {
    'bingeDrinking': 'steelblue',
    'smoking': 'brown',
    'excessDrinking': 'darkorange',
    'poorHealth': 'green',
    'noExercise': 'darkgreen',
    'obesity': 'brown',
    'phyisicianUseDelay': 'purple',
    'socEmoSupport': 'blue',
    'firearmDeaths': 'red',
    'nonFirearmDeaths': 'maroon',
    'totAvg': 'darkblue'
}

for row in brfsscsv:
    key = int(row.pop('id'))
    statfile = row.pop('file')
    statdata = float(row.pop('rate'))*100
    timeFrame = row.pop('timeFrame')
    dimension = row.pop('dimension')
    valMissing = row.pop('missingValue')
    stateCode = row.pop('stateCode')
    popu = row.pop('population')
    deaths = row.pop('deaths')

    if statfile not in meta['d']:
        meta['d'][statfile] = []

    meta['timeFrame'] = timeFrame
    meta['dimension'] = dimension
    meta['d'][statfile].append(statdata)

    if key not in brfss:
        brfss[key] = row

    if 'd' not in brfss[key]:
        brfss[key].update({'d': {}})

    brfss[key]['d'].update({
            statfile: {
                'rate':statdata }
        })

    if valMissing:
        brfss[key]['d'][statfile].update({'valMissing': valMissing})

    if popu:
        brfss[key].update({'population': popu})

    if deaths:
        brfss[key]['d'][statfile].update({'deaths': deaths})

scores = meta['d']

for k in scores:
    if 'valMissing' not in scores[k]:
        natAvg = reduce(lambda x, y: x + y, scores[k]) / len(scores[k])
        natMax = max(scores[k])
        natMin = min(scores[k])
        scores[k] = {'natAvg': natAvg, 'natMin': natMin, 'natMax':natMax}

    scores[k].update({'label':labels[k]})
    scores[k].update({'question':quest[k]})
    scores[k].update({'description':descs[k]})
    scores[k].update({'sources':sources[k]})
    scores[k].update({'color':colors[k]})

allAvgs = []

for r in brfss:
    avgs = []
    for s in brfss[r]['d']:
        natAvg = scores[s]['natAvg']
        dRate = brfss[r]['d'][s]['rate']
        if 'valMissing' not in brfss[r]['d'][s]:
            vsNat = dRate-natAvg
        else:
            vsNat = 0
        avgs.append(vsNat)
        brfss[r]['d'][s].update({'vsNatAvg': vsNat})
    if len(avgs) > 0:
        totAvg = reduce(lambda x, y: x + y, avgs) / len(avgs)
        brfss[r]['d'].update({'totAvg': {'rate': totAvg}})
        allAvgs.append(totAvg)
    brfss[r].update({'lenAvg': len(avgs)})

allAvgsMax = max(allAvgs)
allAvgsMin = min(allAvgs)
# allAvgsAvg = reduce(lambda x, y: x + y, allAvgs) / len(allAvgs)
totResults = len(brfss)

adjMin = 0
adjMax = abs(allAvgsMin)+abs(allAvgsMax)

for r in brfss:
    adjRate = brfss[r]['d']['totAvg']['rate']
    if adjRate != 0:
        adjRate = mapVal(adjRate,allAvgsMin,allAvgsMax,adjMin,adjMax)
        brfss[r]['d']['totAvg']['rate'] = adjRate
    else:
        brfss[r]['d']['totAvg'].update({'valMissing': 'Y'})
    allAvgs.append(adjRate)

allAvgsAvg = reduce(lambda x, y: x + y, allAvgs) / len(allAvgs)

meta.update({'allAvgsMin': adjMin, 'allAvgsMax': adjMax, 'allAvgsAvg': allAvgsAvg, 'totResults': totResults})

scores.update({'totAvg': {'natAvg': allAvgsAvg, 'natMin': adjMin, 'natMax': adjMax, 'label': labels['totAvg'], 'question': quest['totAvg'], 'description' :descs['totAvg'], 'sources':sources['totAvg'],'color':colors['totAvg']}})

metaout = codecs.open('meta.json', 'w', encoding='utf-8')
json.dump(meta, metaout, indent=4, sort_keys=True, ensure_ascii=False)

brfssout = codecs.open('brfss.json', 'w', encoding='utf-8')
json.dump(brfss, brfssout, indent=4, sort_keys=True, ensure_ascii=False)



