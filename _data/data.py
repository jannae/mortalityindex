import csv
import json

brfsscsv = csv.DictReader(open('brfss.csv','rU'))

brfss = {}
meta = {'d':{}}

labels = {
    'bingeDrinking': 'Binge Drinking',
    'smoking': 'Smoking',
    'excessDrinking': 'Excessive Drinking',
    'poorHealth': 'Fair or Poor Health',
    'noExercise': 'Little to No Exercise',
    'obesity': 'Obesity',
    'phyisicianUseDelay': 'Delay Seeing a Doctor',
    'totAvg': 'Death Wish Quotient'
}

descs = {
    'bingeDrinking': 'Binge Drinking',
    'smoking': 'Smoking',
    'excessDrinking': 'Excessive Drinking',
    'poorHealth': 'Fair or Poor Health',
    'noExercise': 'Little to No Exercise',
    'obesity': 'Obesity',
    'phyisicianUseDelay': 'Delay Seeing a Doctor',
    'totAvg': 'Death Wish Quotient'
}

sources = {
    'bingeDrinking': 'Binge Drinking',
    'smoking': 'Smoking',
    'excessDrinking': 'Excessive Drinking',
    'poorHealth': 'Fair or Poor Health',
    'noExercise': 'Little to No Exercise',
    'obesity': 'Obesity',
    'phyisicianUseDelay': 'Delay Seeing a Doctor',
    'totAvg': 'Death Wish Quotient'
}

colors = {
    'bingeDrinking': 'Binge Drinking',
    'smoking': 'Smoking',
    'excessDrinking': 'Excessive Drinking',
    'poorHealth': 'Fair or Poor Health',
    'noExercise': 'Little to No Exercise',
    'obesity': 'Obesity',
    'phyisicianUseDelay': 'Delay Seeing a Doctor',
    'totAvg': 'Death Wish Quotient'
}

for row in brfsscsv:
    key = int(row.pop('id'))
    statfile = row.pop('file')
    statdata = float(row.pop('rate'))*100
    timeFrame = row.pop('timeFrame')
    dimension = row.pop('dimension')
    valMissing = row.pop('missingValue')
    stateCode = row.pop('stateCode')

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

scores = meta['d']

for k in scores:
    if 'valMissing' not in scores[k]:
        natAvg = reduce(lambda x, y: x + y, scores[k]) / len(scores[k])
        natMax = max(scores[k])
        natMin = min(scores[k])
        scores[k] = {'natAvg': natAvg, 'natMin': natMin, 'natMax':natMax}

    scores[k].update({'label':labels[k]})

allAvgs = []

for r in brfss:
    avgs = []
    for s in brfss[r]['d']:
        natAvg = scores[s]['natAvg']
        dRate = brfss[r]['d'][s]['rate']
        # if 'valMissing' not in brfss[r]['d'][s]:
        vsNat = dRate-natAvg
        avgs.append(vsNat)
        brfss[r]['d'][s].update({'vsNatAvg': vsNat})
    if len(avgs) > 0:
        totAvg = reduce(lambda x, y: x + y, avgs) / len(avgs)
        brfss[r]['d'].update({'totAvg': {'rate': totAvg}})
        allAvgs.append(totAvg)
    brfss[r].update({'lenAvg': len(avgs)})

scores.update({'totAvg': {'label':labels['totAvg']}})

allAvgsMax = max(allAvgs)
allAvgsMin = min(allAvgs)
allAvgsAvg = reduce(lambda x, y: x + y, allAvgs) / len(allAvgs)
totResults = len(brfss)

meta.update({'allAvgsMin': allAvgsMin, 'allAvgsMax': allAvgsMax, 'allAvgsAvg': allAvgsAvg, 'totResults': totResults})

scores.update({'totAvg': {'natAvg': allAvgsAvg, 'natMin': allAvgsMin, 'natMax': allAvgsMax, 'label':labels['totAvg']}})

meta = json.dumps(meta)
brfss = json.dumps(brfss)

# print meta
print brfss

def scaleNat(value, srcLow, srcHigh, dstLow, dstHigh):
    # value is outside source range return fail
    if (value < srcLow || value > srcHigh):
        return NaN

    srcMax = srcHigh - srcLow,
    dstMax = dstHigh - dstLow,
    adjValue = value - srcLow;

    return (adjValue * dstMax / srcMax) + dstLow;
}