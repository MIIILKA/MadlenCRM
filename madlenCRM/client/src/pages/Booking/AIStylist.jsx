const [file, setFile] = useState(null);
const [advice, setAdvice] = useState('');
const [loading, setLoading] = useState(false);

const handleAIAnalysis = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await api.post('/ai/analyze', formData);
        setAdvice(res.data.advice);
    } catch (err) {
        alert("Помилка аналізу");
    } finally {
        setLoading(false);
    }
};