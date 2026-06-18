import React, { useState, useRef } from 'react';
import { Home, Plane, Car, Bus, ShoppingBag, Plus, Trash2, ShieldCheck, UploadCloud, Info, Loader2, FileText, CheckCircle2 } from 'lucide-react';

type TabType = 'intro' | 'home' | 'flights' | 'car' | 'transit' | 'secondary' | 'results';

export default function ComprehensiveCalculator() {
  const [activeTab, setActiveTab] = useState<TabType>('intro');
  const [homeInputs, setHomeInputs] = useState({ 
    electricityKwh: '', 
    gasTherms: '', 
    heatingOilGallons: '', 
    coalLbs: '',
    lpgCylinders: '', // Indian context
  });
  
  const [flights, setFlights] = useState<Array<{ id: string; distanceKm: string; travelClass: string; passengers: number }>>([]);
  const [cars, setCars] = useState<Array<{ id: string; distanceKm: string; efficiencyLPer100Km: string; fuelType: string }>>([]);
  const [transit, setTransit] = useState({ busKm: '', trainKm: '', taxiKm: '' });
  const [secondary, setSecondary] = useState({ meatDiet: 'average', clothingSpendMonthly: '', itSpendMonthly: '' });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFlight = () => setFlights([...flights, { id: Math.random().toString(), distanceKm: '1000', travelClass: 'economy', passengers: 1 }]);
  const removeFlight = (id: string) => setFlights(flights.filter(f => f.id !== id));

  const addCar = () => setCars([...cars, { id: Math.random().toString(), distanceKm: '10000', efficiencyLPer100Km: '8', fuelType: 'petrol' }]);
  const removeCar = (id: string) => setCars(cars.filter(c => c.id !== id));

  const calculateResults = () => {
    // Home
    const elec = (parseFloat(homeInputs.electricityKwh) || 0) * 0.85; // kg CO2e per kWh (approx, Indian grid is higher: ~0.85)
    // 1 therm = 29.3 kWh * 0.202 kg = 5.3 kg
    const gas = (parseFloat(homeInputs.gasTherms) || 0) * 5.3;
    const oil = (parseFloat(homeInputs.heatingOilGallons) || 0) * 10;
    const coal = (parseFloat(homeInputs.coalLbs) || 0) * 1.3;
    const lpg = (parseFloat(homeInputs.lpgCylinders) || 0) * 42.5; // ~14.2kg cylinder * 2.99 kg CO2 per kg LPG
    const homeTotal = elec + gas + oil + coal + lpg;

    // Flights
    const flightTotal = flights.reduce((acc, f) => {
      const dist = parseFloat(f.distanceKm) || 0;
      const pax = f.passengers || 1;
      let multiplier = 0.115; // kg per km per pax 
      if (f.travelClass === 'business') multiplier = 0.23;
      if (f.travelClass === 'first') multiplier = 0.34;
      return acc + (dist * multiplier * pax);
    }, 0);

    // Cars
    const carTotal = cars.reduce((acc, c) => {
      const dist = parseFloat(c.distanceKm) || 0;
      const eff = parseFloat(c.efficiencyLPer100Km) || 0;
      let fuelMultiplier = c.fuelType === 'diesel' ? 2.68 : 2.31; // kg per L
      if (c.fuelType === 'cng') fuelMultiplier = 1.9;
      if (c.fuelType === 'ev') return acc + (((dist/100)*eff) * 0.4); // rough EV estimate
      const liters = (dist / 100) * eff;
      return acc + (liters * fuelMultiplier);
    }, 0);

    // Transit
    const transitTotal = (parseFloat(transit.busKm) || 0) * 0.10 + 
                         (parseFloat(transit.trainKm) || 0) * 0.04 + 
                         (parseFloat(transit.taxiKm) || 0) * 0.17;

    // Secondary
    let dietTons = 1.5;
    if (secondary.meatDiet === 'vegan') dietTons = 0.5;
    if (secondary.meatDiet === 'vegetarian') dietTons = 0.9;
    if (secondary.meatDiet === 'heavy-meat') dietTons = 3.3;
    
    const clothing = (parseFloat(secondary.clothingSpendMonthly) || 0) * 12 * 0.01; 
    const itSpend = (parseFloat(secondary.itSpendMonthly) || 0) * 12 * 0.015;
    const secondaryTotal = (dietTons * 1000) + clothing + itSpend;

    const totalKg = homeTotal + flightTotal + carTotal + transitTotal + secondaryTotal;

    return {
      homeTotal, flightTotal, carTotal, transitTotal, secondaryTotal, totalKg
    };
  };

  const results = calculateResults();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Pdf = (event.target?.result as string).split(',')[1];
        const res = await fetch('/api/gemini/parse-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Pdf, mimeType: file.type })
        });
        
        if (res.ok) {
          const data = await res.json();
          setHomeInputs(prev => ({
            ...prev,
            electricityKwh: data.electricityKwh ? data.electricityKwh.toString() : prev.electricityKwh,
            gasTherms: data.gasTherms ? data.gasTherms.toString() : prev.gasTherms,
            heatingOilGallons: data.heatingOilGallons ? data.heatingOilGallons.toString() : prev.heatingOilGallons
          }));
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          alert('Failed to parse bill. Make sure it is a valid PDF or Image document.');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert('An error occurred during upload.');
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const renderTabButton = (type: TabType, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`px-4 py-3 flex flex-col items-center gap-1.5 transition-colors border-b-2 font-semibold text-xs min-w-[80px] ${
        activeTab === type 
          ? 'border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' 
          : 'border-transparent text-gray-500 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 md:from-emerald-800 to-teal-600 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight">ISO-Compliant Deep Carbon Auditor</h2>
          <p className="text-emerald-100 mt-2 text-sm leading-relaxed">
            Inspired by robust footprinting methodologies. 
            Calculate your precise metric tonnage across all major Scope categories.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 hide-scrollbar">
        {renderTabButton('intro', <Info className="w-5 h-5" />, 'Intro')}
        {renderTabButton('home', <Home className="w-5 h-5" />, 'Housing')}
        {renderTabButton('flights', <Plane className="w-5 h-5" />, 'Flights')}
        {renderTabButton('car', <Car className="w-5 h-5" />, 'Vehicle')}
        {renderTabButton('transit', <Bus className="w-5 h-5" />, 'Transit')}
        {renderTabButton('secondary', <ShoppingBag className="w-5 h-5" />, 'Lifestyle')}
        {renderTabButton('results', <ShieldCheck className="w-5 h-5 text-amber-500" />, 'Results')}
      </div>

      {/* Tab Content */}
      <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-800/20 min-h-[400px]">
        
        {activeTab === 'intro' && (
           <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
             <div className="space-y-4">
                 <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">What is a Carbon Footprint?</h3>
                 <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                   A carbon footprint is the total amount of greenhouse gases (including carbon dioxide and methane) that are generated by our actions. 
                   The average carbon footprint for a person globally is closer to 4 tons, while in some developed nations it can be over 15 tons. 
                   To have the best chance of avoiding a 2°C rise in global temperatures, the average global carbon footprint per year needs to drop to under 2 tons by 2050.
                 </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                   <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                     <Home className="w-5 h-5" />
                   </div>
                   <h4 className="font-bold text-gray-900 dark:text-white">Direct Emissions</h4>
                   <p className="text-xs text-gray-500">Gas, electricity, and fuel used in your home and personal vehicles.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                   <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                     <Plane className="w-5 h-5" />
                   </div>
                   <h4 className="font-bold text-gray-900 dark:text-white">Travel Emissions</h4>
                   <p className="text-xs text-gray-500">Flights and public transit which operate on large-scale fossil fuel systems.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                   <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                     <ShoppingBag className="w-5 h-5" />
                   </div>
                   <h4 className="font-bold text-gray-900 dark:text-white">Secondary Emissions</h4>
                   <p className="text-xs text-gray-500">The hidden footprint of the food you eat, clothes you buy, and services you use.</p>
                </div>
             </div>

             <div className="pt-6 flex justify-center">
                 <button onClick={() => setActiveTab('home')} className="bg-emerald-600 text-white px-8 py-3 rounded-full text-md font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition">Start Calculator</button>
             </div>
           </div>
        )}

        {activeTab === 'home' && (
          <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Home Energy Consumption</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your annual consumption, or upload a utility bill to autofill.</p>
            </div>

            {/* Smart PDF Upload Section */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 text-center space-y-4">
               <div className="mx-auto w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (uploadSuccess ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <FileText className="w-6 h-6" />)}
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Smart Bill Autofill (Powered by Gemini)</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">Upload a PDF or Image of your electricity or gas bill. Our AI will automatically extract your usage.</p>
               </div>
               <div>
                  <input 
                    type="file" 
                    accept="application/pdf,image/*" 
                    className="hidden" 
                    id="bill-upload" 
                    onChange={handleFileUpload} 
                    ref={fileInputRef}
                    disabled={isUploading}
                  />
                  <label htmlFor="bill-upload" className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${isUploading ? 'bg-gray-300 text-gray-600 cursor-not-allowed border outline-none' : 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-gray-700 dark:hover:bg-gray-700 hover:shadow-md'}`}>
                    {isUploading ? 'Analyzing Document...' : <><UploadCloud className="w-4 h-4"/> Select Document</>}
                  </label>
               </div>
               {uploadSuccess && <div className="text-xs font-bold text-emerald-600 animate-fade-in mt-2">✨ Data Extracted Successfully! Check inputs below.</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Electricity (kWh/Year)</label>
                <input type="number" value={homeInputs.electricityKwh} onChange={e => setHomeInputs({...homeInputs, electricityKwh: e.target.value})} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium outline-none" placeholder="e.g. 3500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">LPG Cylinders (Yearly)</label>
                <input type="number" value={homeInputs.lpgCylinders} onChange={e => setHomeInputs({...homeInputs, lpgCylinders: e.target.value})} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium outline-none" placeholder="e.g. 8" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Natural Gas (Therms/Year)</label>
                <input type="number" value={homeInputs.gasTherms} onChange={e => setHomeInputs({...homeInputs, gasTherms: e.target.value})} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium outline-none" placeholder="e.g. 50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Heating Oil (Gallons/Year)</label>
                <input type="number" value={homeInputs.heatingOilGallons} onChange={e => setHomeInputs({...homeInputs, heatingOilGallons: e.target.value})} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium outline-none" placeholder="e.g. 0" />
              </div>
            </div>
            
            <div className="pt-6 flex justify-end">
               <button onClick={() => setActiveTab('flights')} className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">Continue to Flights &rarr;</button>
            </div>
          </div>
        )}

        {activeTab === 'flights' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
             <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Flight Registry</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add individual flights taken over the last 12 months.</p>
              </div>
              <button onClick={addFlight} className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full hover:bg-emerald-200 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {flights.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={addFlight}>
                <Plane className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                No flights added. Click the + button above if you traveled by air.
              </div>
            ) : (
              <div className="space-y-4">
                {flights.map((flight, index) => (
                  <div key={flight.id} className="relative p-6 bg-white dark:bg-gray-800 border-l-4 border-emerald-500 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-4 pr-12">
                     <button onClick={() => removeFlight(flight.id)} className="absolute top-6 right-5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                     </button>
                     <div className="font-bold text-sm text-gray-900 dark:text-gray-200">Flight Journey {index + 1}</div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Distance (km)</label>
                          <input type="number" value={flight.distanceKm} onChange={e => {
                            const newFlights = [...flights];
                            newFlights[index].distanceKm = e.target.value;
                            setFlights(newFlights);
                          }} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 5000" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Travel Class</label>
                          <select value={flight.travelClass} onChange={e => {
                             const newFlights = [...flights];
                             newFlights[index].travelClass = e.target.value;
                             setFlights(newFlights);
                          }} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none">
                            <option value="economy">Economy</option>
                            <option value="premium">Premium Economy</option>
                            <option value="business">Business</option>
                            <option value="first">First Class</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Passengers Paid</label>
                          <input type="number" value={flight.passengers} min={1} onChange={e => {
                            const newFlights = [...flights];
                            newFlights[index].passengers = parseInt(e.target.value) || 1;
                            setFlights(newFlights);
                          }} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
             <div className="pt-4 flex justify-end">
               <button onClick={() => setActiveTab('car')} className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">Continue to Vehicles &rarr;</button>
            </div>
          </div>
        )}

        {activeTab === 'car' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
             <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Personal Vehicles</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enter metrics for cars or motorbikes owned.</p>
              </div>
              <button onClick={addCar} className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full hover:bg-emerald-200 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {cars.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={addCar}>
                 <Car className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                No vehicles added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {cars.map((car, index) => (
                  <div key={car.id} className="relative p-6 bg-white dark:bg-gray-800 border-l-4 border-rose-500 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm space-y-4 pr-12">
                     <button onClick={() => removeCar(car.id)} className="absolute top-6 right-5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                     </button>
                     <div className="font-bold text-sm text-gray-900 dark:text-gray-200">Vehicle {index + 1}</div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Annual Distance (km)</label>
                          <input type="number" value={car.distanceKm} onChange={e => {
                            const newCars = [...cars];
                            newCars[index].distanceKm = e.target.value;
                            setCars(newCars);
                          }} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 12000" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Efficiency (L/100km)</label>
                          <input type="number" value={car.efficiencyLPer100Km} onChange={e => {
                            const newCars = [...cars];
                            newCars[index].efficiencyLPer100Km = e.target.value;
                            setCars(newCars);
                          }} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 7.5" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Fuel Type</label>
                          <select value={car.fuelType} onChange={e => {
                             const newCars = [...cars];
                             newCars[index].fuelType = e.target.value;
                             setCars(newCars);
                          }} className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none">
                            <option value="petrol">Petrol</option>
                            <option value="diesel">Diesel</option>
                            <option value="cng">CNG (Compressed NG)</option>
                            <option value="hybrid">Hybrid Engine</option>
                            <option value="ev">Full Electric (EV)</option>
                          </select>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
             <div className="pt-4 flex justify-end">
               <button onClick={() => setActiveTab('transit')} className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">Continue to Transit &rarr;</button>
            </div>
          </div>
        )}

        {activeTab === 'transit' && (
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 relative z-10">Public Transit</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 relative z-10">Estimate your yearly distance traveled on public networks.</p>
                <div className="grid grid-cols-1 gap-5 relative z-10">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Bus / Coach (Annual km)</label>
                    <input type="number" value={transit.busKm} onChange={e => setTransit({...transit, busKm: e.target.value})} className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium outline-none" placeholder="e.g. 500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Local / National Train (Annual km)</label>
                    <input type="number" value={transit.trainKm} onChange={e => setTransit({...transit, trainKm: e.target.value})} className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium outline-none" placeholder="e.g. 1500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Taxi / Rideshare / Auto (Annual km)</label>
                    <input type="number" value={transit.taxiKm} onChange={e => setTransit({...transit, taxiKm: e.target.value})} className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow text-sm font-medium outline-none" placeholder="e.g. 400" />
                  </div>
                </div>
            </div>
            <div className="pt-2 flex justify-end">
               <button onClick={() => setActiveTab('secondary')} className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">Continue to Lifestyle &rarr;</button>
            </div>
          </div>
        )}

        {activeTab === 'secondary' && (
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Secondary (Scope 3) Footprint</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Diet, shopping, and retail services drive enormous indirect emissions.</p>
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Dietary Composition</label>
                      <select value={secondary.meatDiet} onChange={e => setSecondary({...secondary, meatDiet: e.target.value})} className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-colors">
                        <option value="vegan">Vegan - Completely plant-based</option>
                        <option value="vegetarian">Vegetarian - Primarily plant-based + Dairy</option>
                        <option value="average">Average - Occasional meat (1-2 times/week)</option>
                        <option value="heavy-meat">Heavy Meat - Daily consumption</option>
                      </select>
                    </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Monthly Clothing Spend ($/€/£/₹ in USD eqv)</label>
                    <input type="number" value={secondary.clothingSpendMonthly} onChange={e => setSecondary({...secondary, clothingSpendMonthly: e.target.value})} className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-colors" placeholder="e.g. 50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Monthly Tech/Gadgets Spend</label>
                    <input type="number" value={secondary.itSpendMonthly} onChange={e => setSecondary({...secondary, itSpendMonthly: e.target.value})} className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-colors" placeholder="e.g. 30" />
                  </div>
                </div>
            </div>
            <div className="pt-2 flex justify-end">
               <button onClick={() => setActiveTab('results')} className="bg-emerald-600 text-white px-8 py-3 rounded-full text-md font-bold shadow-lg hover:bg-emerald-700 transform hover:scale-105 transition-all">Calculate Audit Report</button>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-4">
             <div className="bg-white dark:bg-gray-900 border-2 border-emerald-500 dark:border-emerald-600 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
               <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-50" />
               <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl opacity-50" />
               <div className="relative z-10">
                 <h3 className="text-sm font-extrabold tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase mb-4">Final Carbon Footprint Assessment</h3>
                 <div className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter flex justify-center items-baseline gap-3 mx-auto">
                   {(results.totalKg / 1000).toFixed(2)}
                   <span className="text-2xl md:text-3xl text-gray-400 font-bold tracking-tight mb-2">Tons</span>
                 </div>
                 <p className="mt-6 text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto font-medium leading-relaxed">
                   In 2023, the global average footprint is approximately 4.2 Tons per person. 
                   <br/><br/>
                   <span className="text-emerald-700 dark:text-emerald-400 font-bold">Your Goal:</span> Target reductions to reach ~2.0 Tons by 2030 to mitigate accelerating climate change impacts.
                 </p>
               </div>
             </div>

             <div>
               <h4 className="text-lg font-extrabold mb-5 text-gray-900 dark:text-white px-1">Segmented Analysis (CO2e)</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                 {[
                   { label: 'Household & Utilities', kg: results.homeTotal, icon: <Home className="w-6 h-6 text-blue-600 dark:text-blue-400"/>, color: 'border-blue-100 bg-blue-50 dark:bg-blue-900/20' },
                   { label: 'Aviation', kg: results.flightTotal, icon: <Plane className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>, color: 'border-indigo-100 bg-indigo-50 dark:bg-indigo-900/20' },
                   { label: 'Personal Vehicles', kg: results.carTotal, icon: <Car className="w-6 h-6 text-rose-600 dark:text-rose-400"/>, color: 'border-rose-100 bg-rose-50 dark:bg-rose-900/20' },
                   { label: 'Public Transit', kg: results.transitTotal, icon: <Bus className="w-6 h-6 text-amber-600 dark:text-amber-400"/>, color: 'border-amber-100 bg-amber-50 dark:bg-amber-900/20' },
                   { label: 'Diet & Lifestyle', kg: results.secondaryTotal, icon: <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/>, color: 'border-emerald-100 bg-emerald-50 dark:bg-emerald-900/20' }
                 ].map(item => (
                   <div key={item.label} className={`p-5 rounded-3xl border bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow`}>
                     <div className={`p-3 rounded-2xl w-14 h-14 flex items-center justify-center ${item.color} dark:border-gray-600`}>
                       {item.icon}
                     </div>
                     <div>
                       <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{(item.kg / 1000).toFixed(2)} <span className="text-sm font-bold text-gray-400">Tons</span></div>
                       <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">{item.label}</div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
